const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const FamilyLink = require('../models/FamilyLink');
const User = require('../models/User');
const Notification = require('../models/Notification');
const OtpVerification = require('../models/OtpVerification');
const whatsappService = require('../services/whatsappService');

const OTP_TTL_MS = 10 * 60 * 1000;
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

exports.getMyFamily = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let links;
    if (role === 'parent') {
      links = await FamilyLink.find({ parent: userId }).populate('child', 'name email phone');
    } else {
      links = await FamilyLink.find({ child: userId }).populate('parent', 'name email phone');
    }

    res.json({ success: true, data: { links } });
  } catch (err) {
    next(err);
  }
};

exports.createInvitation = async (req, res, next) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Only parents can create invitations.' });
    }

    const code = uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invitation = await FamilyLink.create({
      parent: req.user._id,
      child: req.user._id, // placeholder — will be replaced on accept
      invitationCode: code,
      invitationExpiresAt: expires,
      status: 'pending',
    });

    // We set child = parent temporarily; on accept, we replace it.
    // A better pattern: store invitations in a separate pending collection.
    // For MVP, keep it simple and document this.

    res.status(201).json({
      success: true,
      message: 'Invitation created. Share this code with your family member.',
      data: { code, expiresAt: expires },
    });
  } catch (err) {
    next(err);
  }
};

exports.acceptInvitation = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Invitation code required.' });

    const link = await FamilyLink.findOne({ invitationCode: code, status: 'pending' });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Invitation not found or already used.' });
    }

    if (link.invitationExpiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'Invitation has expired.' });
    }

    if (link.parent.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot accept your own invitation.' });
    }

    // Prevent duplicate links
    const existing = await FamilyLink.findOne({
      parent: link.parent,
      child: req.user._id,
      status: { $in: ['pending', 'active'] },
    });
    if (existing && existing._id.toString() !== link._id.toString()) {
      return res.status(409).json({ success: false, message: 'Already linked to this parent.' });
    }

    link.child = req.user._id;
    link.status = 'active';
    link.consentGivenAt = new Date();
    link.invitationCode = undefined;
    await link.save();

    // Notify parent
    await Notification.create({
      recipient: link.parent,
      type: 'family_link_accepted',
      title: 'Family member joined',
      body: `${req.user.name} has accepted your invitation and joined CareConnect.`,
      data: { childId: req.user._id },
    });

    res.json({ success: true, message: 'Invitation accepted. Family link is now active.' });
  } catch (err) {
    next(err);
  }
};

exports.updateConsent = async (req, res, next) => {
  try {
    const { linkId, permissions } = req.body;
    const link = await FamilyLink.findById(linkId);

    if (!link) return res.status(404).json({ success: false, message: 'Link not found.' });

    // Only the parent can update permissions
    if (link.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (permissions) link.permissions = { ...link.permissions, ...permissions };
    await link.save();

    res.json({ success: true, message: 'Consent updated.', data: { link } });
  } catch (err) {
    next(err);
  }
};

// ─── Add Parent Details + WhatsApp OTP verification ─────────────────────────

exports.requestParentOtp = async (req, res, next) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({ success: false, message: 'Only children can add parent details.' });
    }

    const { name, phone, relationship } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Parent name is required.' });
    }
    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number with country code is required (e.g. +919876543210).',
      });
    }

    // Already linked to this child? (active or pending)
    const existingParent = await User.findOne({ phone, role: 'parent' });
    if (existingParent) {
      const existingLink = await FamilyLink.findOne({
        parent: existingParent._id,
        child: req.user._id,
        status: { $in: ['active', 'pending'] },
      });
      if (existingLink) {
        return res.status(409).json({ success: false, message: 'This parent is already linked to your account.' });
      }
    }

    // Invalidate any previous pending OTPs for this requester + phone
    await OtpVerification.updateMany(
      { requestedBy: req.user._id, phone, status: 'pending' },
      { status: 'expired' }
    );

    const otp = String(crypto.randomInt(100000, 1000000));
    const record = await OtpVerification.create({
      phone,
      otpHash: hashOtp(otp),
      requestedBy: req.user._id,
      parentDetails: { name: name.trim(), relationship: relationship?.trim() },
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    const message =
      `[CareConnect] Verification code: ${otp}\n` +
      `Ye code ${req.user.name} ko apne CareConnect parivar se jodne ke liye hai. ` +
      `10 minute me expire ho jayega — kisi ke saath share na karein.`;
    await whatsappService.sendMessage(phone, message);

    res.status(201).json({
      success: true,
      message: `OTP sent to ${phone} on WhatsApp.`,
      data: {
        phone,
        expiresAt: record.expiresAt,
        // Demo mode me phone par message nahi ja sakta, isliye OTP yahan dikhta hai
        ...(whatsappService.isDemo ? { demoOtp: otp } : {}),
      },
      ...(whatsappService.isDemo
        ? { demoMode: true, notice: 'Demo mode: no real WhatsApp connected — OTP shown here so the flow can be tested.' }
        : {}),
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyParentOtp = async (req, res, next) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({ success: false, message: 'Only children can verify parent details.' });
    }

    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
    }

    const record = await OtpVerification.findOne({
      requestedBy: req.user._id,
      phone,
      status: 'pending',
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No pending OTP for this number. Please request a new one.' });
    }
    if (record.expiresAt < new Date()) {
      record.status = 'expired';
      await record.save();
      return res.status(410).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    if (record.attempts >= record.maxAttempts) {
      record.status = 'locked';
      await record.save();
      return res.status(423).json({ success: false, message: 'Too many wrong attempts. Please request a new OTP.' });
    }

    record.attempts += 1;
    const provided = hashOtp(otp);
    const valid =
      provided.length === record.otpHash.length &&
      crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(record.otpHash));

    if (!valid) {
      if (record.attempts >= record.maxAttempts) record.status = 'locked';
      await record.save();
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP.',
        data: { attemptsLeft: Math.max(0, record.maxAttempts - record.attempts) },
      });
    }

    // ── OTP correct: find or create the parent account ──
    let parent = await User.findOne({ phone });
    if (parent && parent.role !== 'parent') {
      return res.status(409).json({
        success: false,
        message: 'This phone number belongs to a non-parent CareConnect account.',
      });
    }
    if (!parent) {
      const digits = phone.replace(/\D/g, '');
      let email = `wa-${digits}@parent.careconnect`;
      if (await User.findOne({ email })) {
        email = `wa-${digits}.${crypto.randomBytes(3).toString('hex')}@parent.careconnect`;
      }
      parent = await User.create({
        name: record.parentDetails.name,
        email,
        // Random password — parents use WhatsApp only, never the web login
        password: crypto.randomBytes(16).toString('hex'),
        role: 'parent',
        phone,
        phoneVerified: true,
        profileComplete: false,
      });
    }

    // ── Activate (or create) the family link ──
    let link = await FamilyLink.findOne({ parent: parent._id, child: req.user._id });
    if (link) {
      link.status = 'active';
      link.invitationCode = undefined;
      link.consentGivenAt = link.consentGivenAt || new Date();
    } else {
      link = new FamilyLink({
        parent: parent._id,
        child: req.user._id,
        status: 'active',
        consentGivenAt: new Date(),
      });
    }
    await link.save();

    record.status = 'verified';
    record.verifiedAt = new Date();
    await record.save();

    // Welcome the parent on WhatsApp
    await whatsappService.sendMessage(
      phone,
      `[CareConnect] Namaste ${parent.name}! ${req.user.name} ne aapko CareConnect parivar se joda hai. ` +
      `Ab aap yahin WhatsApp par help maang sakte hain — jaise "khana chahiye" ya "doctor ke paas jana hai".`
    );

    // In-app notification for the child
    await Notification.create({
      recipient: req.user._id,
      type: 'parent_added',
      title: 'Parent added & verified',
      body: `${parent.name} (${phone}) verified via WhatsApp OTP and linked to your account.`,
      data: { parentId: parent._id, linkId: link._id },
    });

    res.json({
      success: true,
      message: 'OTP verified. Parent linked successfully.',
      data: { parent: parent.toSafeObject(), link },
    });
  } catch (err) {
    next(err);
  }
};
