/**
 * Family Approval Workflow
 * ─────────────────────────────────────────────────────────────────────────────
 * Parent sends a WhatsApp request → CareConnect parses it → linked child gets an
 * Approve / Decline WhatsApp message (plus an in-app notification).
 *
 *   approve → CareConnect places the order/booking, generates a delivery OTP,
 *             and sends the parent the delivery partner's name, phone, ETA and
 *             the OTP.
 *   decline → no order is placed; the parent is informed.
 *
 * Every approval expires (default 15 minutes). The child's reply is authorised
 * against an ACTIVE FamilyLink — a random registered child cannot approve
 * another family's request.
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
const { foodProviders, rideProviders, homeServiceProviders } = require('./integrationAdapters');
const { quickCommerceHandoffs, medicineHandoffs } = require('./handoffLinks');
const whatsappService = require('./whatsappService');
const deliveryService = require('./deliveryService');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const APPROVAL_TTL_MINUTES = Math.max(1, parseInt(process.env.APPROVAL_EXPIRES_MINUTES, 10) || 15);
const OTP_TTL_HOURS = config.delivery.otpTtlHours;

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

function formatRupees(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  }
  return code;
}

async function makeUniqueCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await ApprovalRequest.exists({ code });
    if (!exists) return code;
  }
  throw httpError(500, 'Could not generate a unique approval code.');
}

function generateOtp() {
  return String(crypto.randomInt(1000, 10000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function parseApprovalCommand(text) {
  const raw = String(text || '').trim();
  // Code is optional: providers that drop the button id still send the display
  // text ("Approve"), in which case we resolve the child's newest pending
  // approval. Button ids are parsed separately below.
  const match = raw.match(/^(approve|decline)(?:[\s:_-]+([A-Z0-9]{4,12}))?$/i);
  if (!match) return null;
  return {
    action: match[1].toLowerCase() === 'approve' ? 'approve' : 'decline',
    code: match[2] ? match[2].toUpperCase() : null,
  };
}

function parseButtonId(buttonId) {
  const raw = String(buttonId || '').trim();
  const match = raw.match(/^(approve|decline)[\s:_-]+([A-Z0-9]{4,12})$/i);
  if (!match) return null;
  return {
    action: match[1].toLowerCase() === 'approve' ? 'approve' : 'decline',
    code: match[2].toUpperCase(),
  };
}

async function safeSend(to, text) {
  if (!to) return null;
  try {
    return await whatsappService.sendMessage(to, text);
  } catch (err) {
    console.error(`[Approval] WhatsApp send to ${to} failed:`, err.message);
    return null;
  }
}

async function safeSendButtons(to, payload) {
  if (!to) return null;
  try {
    return await whatsappService.sendButtons(to, payload);
  } catch (err) {
    console.error(`[Approval] WhatsApp buttons to ${to} failed:`, err.message);
    try {
      return await whatsappService.sendMessage(to, payload.fallbackText || payload.text);
    } catch (fallbackErr) {
      console.error(`[Approval] WhatsApp text fallback to ${to} failed:`, fallbackErr.message);
      return null;
    }
  }
}

function buildChildApprovalMessage({ child, parentUser, approval, summary, amount }) {
  const lang = child?.preferredLanguage || 'en';
  const amountLine = amount ? pick(lang, `Amount: ${formatRupees(amount)}`, `Amount: ${formatRupees(amount)}`, `Amount: ${formatRupees(amount)}`) : null;

  return [
    pick(
      lang,
      'CareConnect — Family approval needed',
      'CareConnect — Parivaar se approval chahiye',
      'CareConnect — Family approval chahiye'
    ),
    '',
    pick(lang, `Parent: ${parentUser.name}`, `Parent: ${parentUser.name}`, `Parent: ${parentUser.name}`),
    pick(lang, `Request: ${summary}`, `Request: ${summary}`, `Request: ${summary}`),
    amountLine,
    '',
    pick(
      lang,
      `Reply APPROVE ${approval.code} to confirm or DECLINE ${approval.code} to reject.`,
      `Confirm karne ke liye APPROVE ${approval.code} bhejein, reject karne ke liye DECLINE ${approval.code}.`,
      `Approve karne ke liye APPROVE ${approval.code} bhejo, decline ke liye DECLINE ${approval.code}.`
    ),
    pick(
      lang,
      `This request expires in ${APPROVAL_TTL_MINUTES} minutes.`,
      `Yeh request ${APPROVAL_TTL_MINUTES} minute mein expire ho jayegi.`,
      `Request ${APPROVAL_TTL_MINUTES} min mein expire ho jayegi.`
    ),
  ]
    .filter(Boolean)
    .join('\n');
}

function buildParentPendingMessage(lang) {
  return pick(
    lang,
    'Your request has been sent to your family for approval. We will confirm as soon as they respond.',
    'Aapki request parivaar ko approval ke liye bhej di gayi hai. Jawab milte hi confirm karenge.',
    'Aapki request family ko approval ke liye bhej di hai. Jawab aate hi confirm karenge.'
  );
}

function buildNoFamilyMessage(lang) {
  return pick(
    lang,
    'No family member is linked to your account yet, so this request cannot be approved. Please ask your child to link their account.',
    'Aapke account se koi parivaar member juda nahi hai, isliye request approve nahi ho sakti. Apne bachche ko account link karne ke liye kahein.',
    'Koi family member linked nahi hai, isliye approval nahi mil sakta. Apne bachche ko account link karne ko bolo.'
  );
}

function buildFoodConfirmedMessage(approval, placement, otp) {
  const lang = approval.language || 'en';
  const items = (approval.details?.items || [])
    .map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`)
    .join(', ');
  const total = formatRupees(placement.estimatedTotal);
  const lines = [
    pick(lang, '✅ Order confirmed', '✅ Order confirm ho gaya', '✅ Order confirm ho gaya!'),
    '',
    pick(lang, `Delivery partner: ${placement.riderName}`, `Delivery partner: ${placement.riderName}`, `Delivery boy: ${placement.riderName}`),
    placement.riderPhone ? pick(lang, `Phone: ${placement.riderPhone}`, `Phone: ${placement.riderPhone}`, `Number: ${placement.riderPhone}`) : null,
    pick(lang, `ETA: ~${placement.etaMin} minutes`, `ETA: ~${placement.etaMin} minute`, `Time: ~${placement.etaMin} min`),
    pick(lang, `Delivery OTP: ${otp}`, `Delivery OTP: ${otp}`, `Delivery OTP: ${otp}`),
    pick(lang, 'Share this OTP with the delivery partner at handover.', 'Handover ke samay yeh OTP delivery partner ko dein.', 'Delivery ke waqt yeh OTP delivery boy ko dena.'),
    '',
    items ? pick(lang, `Items: ${items}`, `Items: ${items}`, `Items: ${items}`) : null,
    total ? pick(lang, `Total: ${total}`, `Total: ${total}`, `Total: ${total}`) : null,
    pick(lang, `Ref: ${placement.ref} (DEMO)`, `Ref: ${placement.ref} (DEMO)`, `Ref: ${placement.ref} (DEMO)`),
  ];
  return lines.filter(Boolean).join('\n');
}

function buildRideConfirmedMessage(approval, booking, otp) {
  const lang = approval.language || 'en';
  const lines = [
    pick(lang, '✅ Ride confirmed', '✅ Ride confirm ho gayi', '✅ Ride confirm ho gayi!'),
    '',
    pick(lang, `Driver: ${booking.driverName}`, `Driver: ${booking.driverName}`, `Driver: ${booking.driverName}`),
    booking.driverPhone ? pick(lang, `Phone: ${booking.driverPhone}`, `Phone: ${booking.driverPhone}`, `Number: ${booking.driverPhone}`) : null,
    pick(lang, `Vehicle: ${booking.vehicleDetails}`, `Vehicle: ${booking.vehicleDetails}`, `Vehicle: ${booking.vehicleDetails}`),
    pick(lang, `Pickup: ${approval.details?.pickup || 'Home'} → ${approval.details?.destination || ''}`, `Pickup: ${approval.details?.pickup || 'Home'} → ${approval.details?.destination || ''}`, `Pickup: ${approval.details?.pickup || 'Home'} → ${approval.details?.destination || ''}`),
    pick(lang, `Fare: ${formatRupees(booking.price)}`, `Kiraya: ${formatRupees(booking.price)}`, `Fare: ${formatRupees(booking.price)}`),
    pick(lang, `Ride OTP: ${otp}`, `Ride OTP: ${otp}`, `Ride OTP: ${otp}`),
    pick(lang, 'Share this OTP with the driver at pickup.', 'Pickup par yeh OTP driver ko dein.', 'Pickup par yeh OTP driver ko dena.'),
    '',
    pick(lang, `Ref: ${booking.ref} (DEMO)`, `Ref: ${booking.ref} (DEMO)`, `Ref: ${booking.ref} (DEMO)`),
  ];
  return lines.filter(Boolean).join('\n');
}

function buildServiceConfirmedMessage(approval, booking, otp) {
  const lang = approval.language || 'en';
  const label = String(approval.details?.category || 'home service').replace(/_/g, ' ');
  const lines = [
    pick(lang, '✅ Service booked', '✅ Service book ho gayi', '✅ Service book ho gayi!'),
    '',
    pick(lang, `Service: ${label}`, `Service: ${label}`, `Service: ${label}`),
    pick(lang, `Professional: ${booking.proName}`, `Professional: ${booking.proName}`, `Professional: ${booking.proName}`),
    booking.proPhone ? pick(lang, `Phone: ${booking.proPhone}`, `Phone: ${booking.proPhone}`, `Number: ${booking.proPhone}`) : null,
    pick(lang, `Arrival: ${booking.arrivalWindow}`, `Arrival: ${booking.arrivalWindow}`, `Arrival: ${booking.arrivalWindow}`),
    pick(lang, `Service OTP: ${otp}`, `Service OTP: ${otp}`, `Service OTP: ${otp}`),
    pick(lang, 'Share this OTP with the professional when they arrive.', 'Professional aane par yeh OTP dein.', 'Professional aane par yeh OTP dena.'),
    '',
    pick(lang, `Ref: ${booking.ref} (DEMO)`, `Ref: ${booking.ref} (DEMO)`, `Ref: ${booking.ref} (DEMO)`),
  ];
  return lines.filter(Boolean).join('\n');
}

function buildHandoffApprovedMessage(approval, links) {
  const lang = approval.language || 'en';
  const linkLines = links.map((h) => `${h.providerName}: ${h.url}`).join('\n');
  return [
    pick(lang, '✅ Your family approved the request.', '✅ Parivaar ne request approve kar di.', '✅ Family ne approve kar diya.'),
    '',
    approval.type === 'medicine'
      ? pick(lang, 'Order using the pharmacy links below (search is pre-filled):', 'Neeche diye pharmacy links se order karein (search pehle se bhara hai):', 'Neeche wale pharmacy links se order karo (search bhara hua hai):')
      : pick(lang, 'Order using the 10-minute delivery links below (search is pre-filled):', 'Neeche diye 10-minute delivery links se order karein (search pehle se bhara hai):', 'Neeche wale 10-min links se order karo (search bhara hua hai):'),
    linkLines,
    '',
    approval.type === 'medicine'
      ? pick(lang, '⚠️ Order only as prescribed by your doctor.', '⚠️ Sirf doctor ki prescription ke according dawai lein.', '⚠️ Sirf doctor ki prescription se dawai lena.')
      : null,
    pick(lang, 'A family member has been informed as well.', 'Parivaar ko bhi bata diya gaya hai.', 'Family ko bhi bata diya hai.'),
  ]
    .filter(Boolean)
    .join('\n');
}

function buildDeclinedMessage(approval, responder) {
  const lang = approval.language || 'en';
  return pick(
    lang,
    `❌ ${responder.name || 'Your family member'} declined this request. No order was placed. They will contact you to help.`,
    `❌ ${responder.name || 'Aapke parivaar member'} ne yeh request decline kar di. Koi order nahi hua. Woh aapse contact karenge.`,
    `❌ ${responder.name || 'Family member'} ne request decline kar di. Koi order nahi hua. Woh aapse contact karenge.`
  );
}

function buildExpiredMessage(approval) {
  const lang = approval.language || 'en';
  const links = approval.details?.links;
  const linkLines = Array.isArray(links) && links.length
    ? `\n\n${links.map((h) => `${h.providerName}: ${h.url}`).join('\n')}`
    : '';
  return pick(
    lang,
    `⏳ Your approval request expired because no family member responded in time.${linkLines}`,
    `⏳ Aapki approval request expire ho gayi — parivaar ne samay par jawab nahi diya.${linkLines}`,
    `⏳ Approval request expire ho gayi — family ne time par reply nahi kiya.${linkLines}`
  );
}

/**
 * Create a pending approval, notify every active child in-app, and send the
 * Approve/Decline WhatsApp message. Returns `{ approval, notifiedChildren }`.
 */
async function createApproval({
  parentUser,
  type,
  summary,
  amount = null,
  details = {},
  sourceMessage = '',
  session = null,
  sourceChannel = 'whatsapp',
}) {
  if (!parentUser) throw httpError(400, 'Parent is required.');
  if (!TYPE_LABELS[type]) throw httpError(400, `Unsupported approval type: ${type}`);

  const lang = session?.language || parentUser.preferredLanguage || 'en';
  const links = await FamilyLink.find({ parent: parentUser._id, status: 'active' })
    .populate('child', 'name phone preferredLanguage');

  if (!links.length) {
    await safeSend(parentUser.phone, buildNoFamilyMessage(lang));
    return { approval: null, notifiedChildren: 0 };
  }

  const code = await makeUniqueCode();
  const approval = await ApprovalRequest.create({
    parent: parentUser._id,
    requestedBy: parentUser._id,
    type,
    status: 'pending',
    code,
    summary,
    amount: amount === null ? undefined : Number(amount),
    details,
    sourceChannel,
    sourceMessage,
    language: lang,
    expiresAt: new Date(Date.now() + APPROVAL_TTL_MINUTES * 60 * 1000),
  });

  let notifiedChildren = 0;
  for (const link of links) {
    const child = link.child;
    if (!child) continue;
    notifiedChildren += 1;

    await Notification.create({
      recipient: child._id,
      type: 'approval_request',
      title: 'Approval needed from your parent',
      body: `${parentUser.name}: ${summary}${amount ? ` — ${formatRupees(amount)}` : ''}`,
      data: {
        approvalId: approval._id,
        code: approval.code,
        approvalType: type,
        parentId: parentUser._id,
        parentName: parentUser.name,
      },
      channels: { inApp: true, whatsapp: Boolean(child.phone) },
    });

    if (child.phone) {
      const text = buildChildApprovalMessage({
        child,
        parentUser,
        approval,
        summary,
        amount,
      });
      // The fallback text contains the codes, so approval still works on
      // providers that cannot render interactive buttons (Twilio/sandbox).
      await safeSendButtons(child.phone, {
        text,
        buttons: [
          { id: `approve_${approval.code}`, title: 'Approve' },
          { id: `decline_${approval.code}`, title: 'Decline' },
        ],
        fallbackText: text,
      });
    }
  }

  await safeSend(parentUser.phone, buildParentPendingMessage(lang));

  return { approval, notifiedChildren };
}

async function fulfillApproval(approval, responder) {
  const details = approval.details || {};

  if (approval.type === 'food') {
    const items = Array.isArray(details.items) ? details.items : [];
    if (!items.length) throw httpError(400, 'The food request has no items.');

    const placement = foodProviders.placeOrder({ items });
    const order = await FoodOrder.create({
      parent: approval.parent,
      requestedBy: responder._id,
      items,
      isDemo: true,
      status: 'placed',
      restaurantName: placement.restaurantName,
      demoBookingRef: placement.ref,
      estimatedTotal: placement.estimatedTotal,
      sourceChannel: 'whatsapp',
    });

    const otp = generateOtp();
    return {
      resultType: 'FoodOrder',
      resultId: order._id,
      resultRef: placement.ref,
      isDemo: placement.isDemo !== false,
      partner: {
        role: 'Delivery partner',
        name: placement.riderName,
        phone: placement.riderPhone,
        etaMinutes: placement.etaMin,
      },
      otp,
      parentMessage: buildFoodConfirmedMessage(approval, placement, otp),
      childMessage: `Approved — food order placed. Delivery OTP has been sent to ${approval.parent?.name || 'your parent'}.`,
      notificationTitle: 'Food order approved',
    };
  }

  if (approval.type === 'ride') {
    const booking = rideProviders.bookRide({
      providerId: details.providerId,
      vehicleId: details.vehicleId,
      pickup: details.pickup || 'Home',
      destination: details.destination,
    });
    if (!booking) throw httpError(400, 'The selected ride option is no longer available.');

    const ride = await RideRequest.create({
      parent: approval.parent,
      requestedBy: responder._id,
      pickup: { address: details.pickup || 'Home' },
      destination: { address: details.destination },
      scheduledAt: details.scheduledAt ? new Date(details.scheduledAt) : new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: 'requested',
      isDemo: true,
      externalProvider: booking.providerId,
      demoBookingRef: booking.ref,
      estimatedFare: booking.price,
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      vehicleDetails: booking.vehicleDetails,
      sourceChannel: 'whatsapp',
    });

    const otp = generateOtp();
    return {
      resultType: 'RideRequest',
      resultId: ride._id,
      resultRef: booking.ref,
      isDemo: booking.isDemo !== false,
      partner: {
        role: 'Driver',
        name: booking.driverName,
        phone: booking.driverPhone,
        vehicle: booking.vehicleDetails,
        etaMinutes: booking.etaMin,
      },
      otp,
      parentMessage: buildRideConfirmedMessage(approval, booking, otp),
      childMessage: `Approved — ride booked. Driver OTP has been sent to ${approval.parent?.name || 'your parent'}.`,
      notificationTitle: 'Ride approved',
    };
  }

  if (approval.type === 'home_service') {
    const uc = homeServiceProviders.bookService({ categoryId: details.category });
    const booking = await ServiceBooking.create({
      parent: approval.parent,
      requestedBy: responder._id,
      serviceCategory: details.category,
      description: details.description || approval.sourceMessage,
      scheduledAt: details.scheduledAt ? new Date(details.scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'requested',
      sourceChannel: 'whatsapp',
      demoBookingRef: uc.ref,
      estimatedPrice: details.estimatedPrice,
      isDemo: true,
    });

    const otp = generateOtp();
    return {
      resultType: 'ServiceBooking',
      resultId: booking._id,
      resultRef: uc.ref,
      isDemo: uc.isDemo !== false,
      partner: {
        role: 'Service professional',
        name: uc.proName,
        phone: uc.proPhone,
        arrivalWindow: uc.arrivalWindow,
      },
      otp,
      parentMessage: buildServiceConfirmedMessage(approval, uc, otp),
      childMessage: `Approved — home service booked. Service OTP has been sent to ${approval.parent?.name || 'your parent'}.`,
      notificationTitle: 'Home service approved',
    };
  }

  if (approval.type === 'grocery') {
    const query = (details.items || []).slice(0, 3).join(' ') || 'grocery';
    const links = quickCommerceHandoffs(query);
    return {
      resultType: null,
      resultId: null,
      resultRef: null,
      partner: null,
      otp: null,
      parentMessage: buildHandoffApprovedMessage(approval, links),
      childMessage: `Approved — quick-commerce links have been sent to ${approval.parent?.name || 'your parent'}.`,
      notificationTitle: 'Daily items request approved',
    };
  }

  // medicine
  const query = (details.medicines || []).slice(0, 3).join(' ') || 'medicine';
  const links = medicineHandoffs(query);
  return {
    resultType: null,
    resultId: null,
    resultRef: null,
    partner: null,
    otp: null,
    parentMessage: buildHandoffApprovedMessage(approval, links),
    childMessage: `Approved — pharmacy links have been sent to ${approval.parent?.name || 'your parent'}.`,
    notificationTitle: 'Medicine request approved',
  };
}

async function notifyAfterDecision(approval, responder, result, action, reason) {
  const parent = approval.parent;
  const parentId = parent?._id || approval.parent;

  if (action === 'approve') {
    await Notification.create({
      recipient: parentId,
      type: 'approval_approved',
      title: result.notificationTitle || 'Request approved',
      body: approval.summary,
      data: {
        approvalId: approval._id,
        resultType: result.resultType,
        resultId: result.resultId,
        resultRef: result.resultRef,
      },
    });
  } else {
    await Notification.create({
      recipient: parentId,
      type: 'approval_declined',
      title: 'Request declined',
      body: approval.summary,
      data: { approvalId: approval._id, reason: reason || null },
    });
  }

  if (parent?.phone) {
    await safeSend(
      parent.phone,
      action === 'approve'
        ? result.parentMessage
        : buildDeclinedMessage(approval, responder)
    );
  }

  if (responder?.phone) {
    await safeSend(
      responder.phone,
      action === 'approve'
        ? result.childMessage
        : `You declined ${approval.summary}. Your parent has been informed.`
    );
  }

  await AuditLog.create({
    actor: responder._id,
    actorRole: responder.role,
    action: action === 'approve' ? 'approval.approved' : 'approval.declined',
    resource: 'ApprovalRequest',
    resourceId: approval._id,
    details: { type: approval.type, summary: approval.summary, resultRef: result?.resultRef || null },
  });
}

/**
 * Approve/decline an approval. `responder` must be the authenticated child
 * (from WhatsApp or the dashboard API).
 */
async function respondToApproval({ approvalId, code, action, responder, reason }) {
  if (!responder) throw httpError(401, 'Authentication required.');
  if (responder.role !== 'child') {
    throw httpError(403, 'Only a linked family member can approve this request.');
  }
  if (!['approve', 'decline'].includes(action)) throw httpError(400, 'action must be approve or decline.');

  let approval;
  if (approvalId) {
    if (!mongoose.isValidObjectId(approvalId)) throw httpError(400, 'Invalid approval id.');
    approval = await ApprovalRequest.findById(approvalId).populate('parent', 'name phone preferredLanguage');
  } else if (code) {
    approval = await ApprovalRequest.findOne({ code: String(code).trim().toUpperCase() }).populate(
      'parent',
      'name phone preferredLanguage'
    );
  } else {
    // No code (e.g. a provider stripped the button id and sent only the label):
    // resolve the child's newest still-pending approval across linked parents.
    const links = await FamilyLink.find({ child: responder._id, status: 'active' }).select('parent');
    approval = await ApprovalRequest.findOne({
      parent: { $in: links.map((link) => link.parent) },
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate('parent', 'name phone preferredLanguage');
  }

  if (!approval) throw httpError(404, 'Approval request not found.');

  // Authorise FIRST — a random child must not be able to expire or probe
  // another family's request by guessing an id or code.
  const link = await FamilyLink.findOne({
    parent: approval.parent?._id || approval.parent,
    child: responder._id,
    status: 'active',
  });
  if (!link) {
    throw httpError(403, 'You are not linked to this parent.', 'Aap is parent se linked nahi hain.');
  }

  if (approval.status !== 'pending') {
    throw httpError(409, `This request is already ${approval.status}.`, `Yeh request already ${approval.status} hai.`);
  }
  if (approval.expiresAt <= new Date()) {
    await expireOne(approval);
    throw httpError(410, 'This approval request has expired.', 'Yeh approval request expire ho gayi hai.');
  }

  if (action === 'decline') {
    const claimed = await ApprovalRequest.findOneAndUpdate(
      { _id: approval._id, status: 'pending' },
      {
        $set: {
          status: 'declined',
          respondedBy: responder._id,
          respondedAt: new Date(),
          declineReason: reason ? String(reason).slice(0, 300) : undefined,
        },
      },
      { new: true }
    ).populate('parent', 'name phone preferredLanguage');

    if (!claimed) throw httpError(409, 'This request has already been handled.');
    try {
      await notifyAfterDecision(claimed, responder, null, 'decline', reason);
    } catch (err) {
      console.error('[Approval] Decline notification failed:', err.message);
    }
    return { approval: claimed, childMessage: 'Declined. Your parent has been informed.' };
  }

  // Atomically claim the request so two children (or two button taps) cannot
  // place the same order twice.
  const claimed = await ApprovalRequest.findOneAndUpdate(
    { _id: approval._id, status: 'pending' },
    { $set: { status: 'processing', respondedBy: responder._id, respondedAt: new Date() } },
    { new: true }
  ).populate('parent', 'name phone preferredLanguage');

  if (!claimed) throw httpError(409, 'This request has already been handled.');

  let result;
  try {
    result = await fulfillApproval(claimed, responder);
  } catch (err) {
    claimed.status = 'failed';
    await claimed.save();
    await safeSend(
      claimed.parent?.phone,
      'We could not place this order automatically. Your family has been informed and will help you shortly.'
    );
    await Notification.create({
      recipient: claimed.parent?._id || claimed.parent,
      type: 'approval_declined',
      title: 'Request could not be completed',
      body: claimed.summary,
      data: { approvalId: claimed._id, error: err.message },
    });
    throw err;
  }

  claimed.status = 'approved';
  claimed.resultType = result.resultType;
  claimed.resultId = result.resultId;
  claimed.resultRef = result.resultRef;
  claimed.deliveryPartner = result.partner || undefined;
  if (result.otp) {
    claimed.deliveryOtpHash = hashOtp(result.otp);
    claimed.deliveryOtpExpiresAt = new Date(Date.now() + OTP_TTL_HOURS * 60 * 60 * 1000);
  }
  claimed.parentNotifiedAt = new Date();
  await claimed.save();

  // The order is already placed — a handoff-link failure must not flip the
  // approval to "failed". The family can always rotate a fresh link later.
  let handoff = null;
  if (result.otp) {
    try {
      handoff = await deliveryService.createHandoffToken(claimed);
      const partnerLabel = result.partner?.role || 'delivery partner';
      result.childMessage =
        `${result.childMessage}\n\nDelivery verification link (share with the ${partnerLabel} if needed):\n${handoff.url}`;
      if (!result.isDemo) {
        await deliveryService.notifyRider(claimed, handoff.url);
      }
    } catch (err) {
      console.error('[Approval] Delivery handoff link could not be created:', err.message);
    }
  }

  try {
    await notifyAfterDecision(claimed, responder, result, 'approve');
  } catch (err) {
    // Notifications are best effort; the order itself is already placed.
    console.error('[Approval] Post-approval notification failed:', err.message);
  }

  return {
    approval: claimed,
    childMessage: result.childMessage,
    handoffUrl: handoff?.url || null,
  };
}

async function expireOne(approval) {
  const expired = await ApprovalRequest.findOneAndUpdate(
    { _id: approval._id, status: 'pending' },
    { $set: { status: 'expired' } },
    { new: true }
  ).populate('parent', 'name phone preferredLanguage');

  if (!expired) return null;

  await Notification.create({
    recipient: expired.parent?._id || expired.parent,
    type: 'approval_expired',
    title: 'Approval request expired',
    body: expired.summary,
    data: { approvalId: expired._id },
  });

  await safeSend(expired.parent?.phone, buildExpiredMessage(expired));
  return expired;
}

async function expireStaleApprovals() {
  const stale = await ApprovalRequest.find({
    status: 'pending',
    expiresAt: { $lte: new Date() },
  }).select('_id');

  let expired = 0;
  for (const item of stale) {
    // eslint-disable-next-line no-await-in-loop
    const result = await expireOne(item);
    if (result) expired += 1;
  }
  return expired;
}

function approvalFilterForUser(user) {
  if (user.role === 'child') {
    return FamilyLink.find({ child: user._id, status: 'active' }).select('parent').then((links) => ({
      parent: { $in: links.map((l) => l.parent) },
    }));
  }
  if (user.role === 'parent') return Promise.resolve({ parent: user._id });
  return Promise.resolve({}); // admin
}

function toSafeApproval(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.deliveryOtpHash;
  delete obj.handoffTokenHash;
  if (obj.handoffTokenExpiresAt) {
    obj.handoffExpiresAt = obj.handoffTokenExpiresAt;
  }
  delete obj.handoffTokenExpiresAt;
  return obj;
}

async function listApprovals(user, { status, limit = 50 } = {}) {
  const filter = await approvalFilterForUser(user);
  if (status) filter.status = status;

  const approvals = await ApprovalRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit, 10) || 50, 100))
    .populate('parent', 'name phone')
    .populate('respondedBy', 'name');

  return approvals.map(toSafeApproval);
}

async function getApproval(user, id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid approval id.');
  const filter = await approvalFilterForUser(user);
  filter._id = id;
  const approval = await ApprovalRequest.findOne(filter)
    .populate('parent', 'name phone')
    .populate('respondedBy', 'name');
  if (!approval) throw httpError(404, 'Approval request not found.');
  return toSafeApproval(approval);
}

module.exports = {
  APPROVAL_TTL_MINUTES,
  TYPE_LABELS,
  createApproval,
  respondToApproval,
  expireStaleApprovals,
  listApprovals,
  getApproval,
  parseApprovalCommand,
  parseButtonId,
  _buildChildApprovalMessage: buildChildApprovalMessage,
  _buildParentPendingMessage: buildParentPendingMessage,
};
