/**
 * Delivery OTP verification + delivery-partner handoff
 * ─────────────────────────────────────────────────────────────────────────────
 * When a child approves a food / ride / home-service request, CareConnect sends
 * the parent a 4-digit delivery OTP (only its hash is stored) and issues a
 * one-time handoff link for the delivery partner:
 *
 *   parent gives OTP to rider at handover
 *   rider opens /delivery/<token>, sees the job details and enters the OTP
 *   CareConnect verifies the hash, marks the order complete and notifies family
 *
 * The handoff token is 32 random bytes (base64url). Only its SHA-256 hash is
 * stored, so a database leak cannot be used to open live delivery links.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const config = require('../config');
const ApprovalRequest = require('../models/ApprovalRequest');
const FamilyLink = require('../models/FamilyLink');
const Notification = require('../models/Notification');
const FoodOrder = require('../models/FoodOrder');
const RideRequest = require('../models/RideRequest');
const ServiceBooking = require('../models/ServiceBooking');
const AuditLog = require('../models/AuditLog');
const whatsappService = require('./whatsappService');

const TYPE_LABELS = {
  food: 'Food order',
  ride: 'Ride booking',
  home_service: 'Home service',
  grocery: 'Daily items',
  medicine: 'Medicines',
};

function httpError(statusCode, message, userMessage) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.userMessage = userMessage || message;
  return err;
}

function pick(lang, en, hi, hinglish) {
  if (lang === 'hi') return hi;
  if (lang === 'hinglish') return hinglish;
  return en;
}

/** Audit logging must never break a delivery flow. */
async function auditBestEffort(fields) {
  try {
    await AuditLog.create(fields);
  } catch (err) {
    console.error('[Delivery] Audit log failed:', err.message);
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function hashOtp(otp) {
  return sha256(otp);
}

function otpMatches(otp, storedHash) {
  if (!storedHash) return false;
  const actual = Buffer.from(hashOtp(otp), 'hex');
  const expected = Buffer.from(String(storedHash), 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function normalizeToken(raw) {
  const token = String(raw || '').trim();
  // base64url of 32 bytes is 43 chars. Reject anything wildly different before
  // touching the database.
  if (token.length < 20 || token.length > 200) return null;
  return token;
}

function handoffUrl(token) {
  return `${String(config.clientUrl).replace(/\/+$/, '')}/delivery/${token}`;
}

async function findByHandoffToken(token) {
  const normalized = normalizeToken(token);
  if (!normalized) return null;
  return ApprovalRequest.findOne({ handoffTokenHash: sha256(normalized) })
    .populate('parent', 'name phone preferredLanguage');
}

/**
 * Issue (or rotate) the delivery-partner link for an approved request.
 * The raw token is returned exactly once — only its hash is persisted.
 */
async function createHandoffToken(approval, { expiresAt } = {}) {
  if (!approval) throw httpError(400, 'Approval is required.');

  const token = crypto.randomBytes(32).toString('base64url');
  approval.handoffTokenHash = sha256(token);
  approval.handoffTokenExpiresAt =
    expiresAt ||
    new Date(Date.now() + config.delivery.handoffExpiresHours * 60 * 60 * 1000);
  await approval.save();

  return {
    token,
    url: handoffUrl(token),
    expiresAt: approval.handoffTokenExpiresAt,
  };
}

function buildOrderView(approval) {
  const details = approval.details || {};

  if (approval.type === 'food') {
    return {
      items: (details.items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice ?? null,
      })),
      restaurantName: details.restaurantName || null,
    };
  }
  if (approval.type === 'ride') {
    return {
      pickup: details.pickup || 'Home',
      destination: details.destination || '',
      scheduledAt: details.scheduledAt || null,
      vehicle: approval.deliveryPartner?.vehicle || null,
    };
  }
  if (approval.type === 'home_service') {
    return {
      category: details.category || 'home_service',
      description: details.description || null,
      scheduledAt: details.scheduledAt || null,
    };
  }
  return {};
}

function safeHandoffView(approval) {
  return {
    approvalId: approval._id,
    type: approval.type,
    typeLabel: TYPE_LABELS[approval.type] || approval.type,
    summary: approval.summary,
    amount: approval.amount ?? null,
    currency: approval.currency || 'INR',
    parent: {
      name: approval.parent?.name || 'CareConnect customer',
      phone: approval.parent?.phone || null,
    },
    partner: approval.deliveryPartner || null,
    reference: approval.resultRef || null,
    order: buildOrderView(approval),
    otpExpiresAt: approval.deliveryOtpExpiresAt || null,
    linkExpiresAt: approval.handoffTokenExpiresAt || null,
    verified: Boolean(approval.deliveryVerifiedAt),
    verifiedAt: approval.deliveryVerifiedAt || null,
    attemptsRemaining: Math.max(
      0,
      config.delivery.otpMaxAttempts - (approval.deliveryOtpAttempts || 0)
    ),
    lockedUntil: approval.deliveryOtpLockedUntil || null,
  };
}

async function getHandoffView(token) {
  const approval = await findByHandoffToken(token);
  if (!approval) {
    throw httpError(404, 'Delivery link not found.', 'This delivery link is invalid. Please ask the family to share a new link.');
  }

  const now = new Date();
  if (!approval.handoffTokenExpiresAt || approval.handoffTokenExpiresAt <= now) {
    throw httpError(410, 'Delivery link expired.', 'This delivery link has expired. Please ask the family to share a new link.');
  }

  if (approval.status === 'pending' || approval.status === 'processing') {
    throw httpError(409, 'This order is not ready yet.', 'This order is still being confirmed. Please try again in a minute.');
  }
  if (approval.status !== 'approved') {
    throw httpError(410, 'This request is no longer active.', 'This delivery is no longer active.');
  }
  if (!approval.deliveryOtpHash && !approval.deliveryVerifiedAt) {
    throw httpError(409, 'No delivery OTP for this request.', 'This request does not have a delivery OTP.');
  }

  // First open is recorded for the family's timeline (best effort).
  if (!approval.handoffOpenedAt) {
    const opened = await ApprovalRequest.updateOne(
      { _id: approval._id, handoffOpenedAt: null },
      { $set: { handoffOpenedAt: now } }
    );
    if (opened.modifiedCount) {
      await auditBestEffort({
        actorRole: 'delivery_partner',
        action: 'delivery.handoff_opened',
        resource: 'ApprovalRequest',
        resourceId: approval._id,
        details: { type: approval.type },
      });
    }
  }

  return safeHandoffView(approval);
}

async function completeLinkedOrder(approval, verifiedAt) {
  if (!approval.resultId || !mongoose.isValidObjectId(approval.resultId)) return;

  if (approval.resultType === 'FoodOrder') {
    await FoodOrder.updateOne(
      { _id: approval.resultId },
      { $set: { status: 'delivered', deliveredAt: verifiedAt } }
    );
  } else if (approval.resultType === 'RideRequest') {
    await RideRequest.updateOne(
      { _id: approval.resultId },
      { $set: { status: 'completed', completedAt: verifiedAt } }
    );
  } else if (approval.resultType === 'ServiceBooking') {
    await ServiceBooking.updateOne(
      { _id: approval.resultId },
      { $set: { status: 'completed', completedAt: verifiedAt } }
    );
  }
}

function buildVerifiedParentMessage(approval) {
  const lang = approval.language || 'en';
  return pick(
    lang,
    `✅ Delivery verified for your ${TYPE_LABELS[approval.type]?.toLowerCase() || 'request'}: ${approval.summary}. Thank you for sharing the OTP.`,
    `✅ Aapki ${TYPE_LABELS[approval.type]?.toLowerCase() || 'request'} ke liye delivery verify ho gayi: ${approval.summary}. OTP share karne ke liye dhanyavaad.`,
    `✅ Delivery verify ho gayi — ${approval.summary}. OTP share karne ke liye thank you.`
  );
}

async function notifyDeliveryVerified(approval, verifiedAt) {
  const parentId = approval.parent?._id || approval.parent;
  const summary = approval.summary;

  try {
    await Notification.create({
      recipient: parentId,
      type: 'approval_delivered',
      title: 'Delivery verified',
      body: `${summary} — delivery completed at ${verifiedAt.toLocaleString('en-IN')}.`,
      data: {
        approvalId: approval._id,
        verifiedAt,
        resultType: approval.resultType,
        resultId: approval.resultId,
      },
    });

    if (approval.respondedBy) {
      await Notification.create({
        recipient: approval.respondedBy,
        type: 'approval_delivered',
        title: 'Delivery verified',
        body: `${summary} — the delivery partner verified the OTP.`,
        data: { approvalId: approval._id, verifiedAt },
      });
    }
  } catch (err) {
    console.error('[Delivery] Verification notifications failed:', err.message);
  }

  if (approval.parent?.phone) {
    try {
      await whatsappService.sendMessage(
        approval.parent.phone,
        buildVerifiedParentMessage(approval)
      );
    } catch (err) {
      console.error('[Delivery] Parent verification message failed:', err.message);
    }
  }
}

/**
 * Public: verify the 4-digit delivery OTP from the handoff link.
 * Idempotent — verifying an already-verified delivery returns success.
 */
async function verifyHandoffOtp(token, rawOtp, meta = {}) {
  const otp = String(rawOtp || '').trim();
  if (!/^\d{4}$/.test(otp)) {
    throw httpError(400, 'OTP must be 4 digits.', 'Please enter the 4-digit OTP shared by the customer.');
  }

  const approval = await findByHandoffToken(token);
  if (!approval) {
    throw httpError(404, 'Delivery link not found.', 'This delivery link is invalid. Please ask the family to share a new link.');
  }

  if (approval.deliveryVerifiedAt) {
    return {
      alreadyVerified: true,
      verifiedAt: approval.deliveryVerifiedAt,
      summary: approval.summary,
      type: approval.type,
      typeLabel: TYPE_LABELS[approval.type] || approval.type,
    };
  }

  const now = new Date();
  if (!approval.handoffTokenExpiresAt || approval.handoffTokenExpiresAt <= now) {
    throw httpError(410, 'Delivery link expired.', 'This delivery link has expired. Please ask the family to share a new link.');
  }
  if (approval.status !== 'approved') {
    throw httpError(
      approval.status === 'pending' || approval.status === 'processing' ? 409 : 410,
      'This request cannot be verified.',
      'This delivery is not active right now.'
    );
  }
  if (!approval.deliveryOtpHash) {
    throw httpError(409, 'No delivery OTP for this request.', 'This request does not have a delivery OTP.');
  }
  if (approval.deliveryOtpExpiresAt && approval.deliveryOtpExpiresAt <= now) {
    throw httpError(410, 'Delivery OTP expired.', 'The delivery OTP has expired. Please ask the family to generate a new one.');
  }
  if (approval.deliveryOtpLockedUntil && approval.deliveryOtpLockedUntil > now) {
    const minutes = Math.max(
      1,
      Math.ceil((approval.deliveryOtpLockedUntil.getTime() - now.getTime()) / 60000)
    );
    throw httpError(
      429,
      'Too many incorrect attempts.',
      `Too many incorrect attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
    );
  }

  // Count this attempt atomically before comparing, so parallel guesses cannot
  // exceed the configured allowance.
  const attempted = await ApprovalRequest.findOneAndUpdate(
    { _id: approval._id, status: 'approved', deliveryVerifiedAt: null },
    {
      $inc: { deliveryOtpAttempts: 1 },
      $set: { handoffOpenedAt: approval.handoffOpenedAt || now },
    },
    { new: true }
  );

  if (!attempted) {
    const current = await ApprovalRequest.findById(approval._id);
    if (current?.deliveryVerifiedAt) {
      return {
        alreadyVerified: true,
        verifiedAt: current.deliveryVerifiedAt,
        summary: current.summary,
        type: current.type,
        typeLabel: TYPE_LABELS[current.type] || current.type,
      };
    }
    throw httpError(409, 'This delivery is no longer active.');
  }

  if (!otpMatches(otp, attempted.deliveryOtpHash)) {
    const attempts = attempted.deliveryOtpAttempts || 0;
    const remaining = Math.max(0, config.delivery.otpMaxAttempts - attempts);

    if (attempts >= config.delivery.otpMaxAttempts) {
      const lockedUntil = new Date(
        Date.now() + config.delivery.otpLockMinutes * 60 * 1000
      );
      await ApprovalRequest.updateOne(
        { _id: attempted._id },
        { $set: { deliveryOtpLockedUntil: lockedUntil, deliveryOtpAttempts: 0 } }
      );
      await auditBestEffort({
        actorRole: 'delivery_partner',
        action: 'delivery.otp_locked',
        resource: 'ApprovalRequest',
        resourceId: attempted._id,
        ip: meta.ip,
        userAgent: meta.userAgent,
        success: false,
        details: { attempts },
      });
      throw httpError(
        429,
        'Too many incorrect attempts.',
        `Too many incorrect attempts. Please try again in ${config.delivery.otpLockMinutes} minutes.`
      );
    }

    await auditBestEffort({
      actorRole: 'delivery_partner',
      action: 'delivery.otp_failed',
      resource: 'ApprovalRequest',
      resourceId: attempted._id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      success: false,
      details: { attempts, remaining },
    });
    throw httpError(
      400,
      'Incorrect OTP.',
      `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
    );
  }

  // Correct OTP: atomically mark verified and burn the OTP hash.
  const verified = await ApprovalRequest.findOneAndUpdate(
    { _id: attempted._id, status: 'approved', deliveryVerifiedAt: null },
    {
      $set: { deliveryVerifiedAt: now, deliveryOtpAttempts: 0 },
      $unset: { deliveryOtpHash: 1, deliveryOtpLockedUntil: 1 },
    },
    { new: true }
  ).populate('parent', 'name phone preferredLanguage');

  if (!verified) {
    // A concurrent request may have verified the same delivery first.
    const current = await ApprovalRequest.findById(attempted._id);
    if (current?.deliveryVerifiedAt) {
      return {
        alreadyVerified: true,
        verifiedAt: current.deliveryVerifiedAt,
        summary: current.summary,
        type: current.type,
        typeLabel: TYPE_LABELS[current.type] || current.type,
      };
    }
    throw httpError(409, 'This delivery was already verified.');
  }

  try {
    await completeLinkedOrder(verified, now);
  } catch (err) {
    console.error('[Delivery] Could not update the linked order:', err.message);
  }
  await notifyDeliveryVerified(verified, now);

  await auditBestEffort({
    actorRole: 'delivery_partner',
    action: 'delivery.otp_verified',
    resource: 'ApprovalRequest',
    resourceId: verified._id,
    ip: meta.ip,
    userAgent: meta.userAgent,
    details: {
      type: verified.type,
      resultType: verified.resultType,
      resultRef: verified.resultRef,
    },
  });

  return {
    alreadyVerified: false,
    verified: true,
    verifiedAt: now,
    summary: verified.summary,
    type: verified.type,
    typeLabel: TYPE_LABELS[verified.type] || verified.type,
    reference: verified.resultRef || null,
  };
}

/**
 * Authenticated: rotate the handoff link so the family can re-share it (for
 * example when the rider lost the WhatsApp message).
 */
async function issueHandoffLink(user, approvalId) {
  if (!mongoose.isValidObjectId(approvalId)) {
    throw httpError(400, 'Invalid approval id.');
  }

  const approval = await ApprovalRequest.findById(approvalId).populate(
    'parent',
    'name phone preferredLanguage'
  );
  if (!approval) throw httpError(404, 'Approval request not found.');

  const parentId = approval.parent?._id || approval.parent;
  let allowed = user.role === 'admin';
  if (!allowed && user.role === 'parent') {
    allowed = String(parentId) === String(user._id);
  }
  if (!allowed && user.role === 'child') {
    allowed = Boolean(
      await FamilyLink.exists({
        parent: parentId,
        child: user._id,
        status: 'active',
      })
    );
  }
  if (!allowed) throw httpError(403, 'You cannot access this delivery.');

  if (approval.deliveryVerifiedAt) {
    throw httpError(409, 'This delivery is already verified.');
  }
  if (approval.status !== 'approved') {
    throw httpError(409, 'This request is not approved yet.');
  }
  if (!approval.deliveryOtpHash) {
    throw httpError(409, 'This request does not have a delivery OTP.');
  }

  const handoff = await createHandoffToken(approval);

  await auditBestEffort({
    actor: user._id,
    actorRole: user.role,
    action: 'delivery.handoff_link_issued',
    resource: 'ApprovalRequest',
    resourceId: approval._id,
    details: { expiresAt: handoff.expiresAt },
  });

  return {
    handoffUrl: handoff.url,
    expiresAt: handoff.expiresAt,
  };
}

function buildRiderHandoffMessage(approval, url) {
  return [
    '🛵 CareConnect delivery assignment',
    '',
    `Order: ${approval.summary}`,
    `Customer: ${approval.parent?.name || 'Customer'}${
      approval.parent?.phone ? ` (${approval.parent.phone})` : ''
    }`,
    approval.resultRef ? `Ref: ${approval.resultRef}` : null,
    '',
    'At handover, ask the customer for the 4-digit delivery OTP, then open this secure link and enter it:',
    url,
    '',
    'This link is personal — do not share it.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function notifyRider(approval, url) {
  const phone = approval.deliveryPartner?.phone;
  if (!phone) return null;
  try {
    return await whatsappService.sendMessage(phone, buildRiderHandoffMessage(approval, url));
  } catch (err) {
    console.error(`[Delivery] Rider handoff message to ${phone} failed:`, err.message);
    return null;
  }
}

module.exports = {
  TYPE_LABELS,
  createHandoffToken,
  getHandoffView,
  verifyHandoffOtp,
  issueHandoffLink,
  notifyRider,
  buildRiderHandoffMessage,
  _hashOtp: hashOtp,
};
