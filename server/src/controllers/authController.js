const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const ParentProfile = require('../models/ParentProfile');
const AuditLog = require('../models/AuditLog');
const OtpVerification = require('../models/OtpVerification');
const whatsappService = require('../services/whatsappService');
const config = require('../config');

const signToken = (userId) =>
  jwt.sign({ id: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

const cookieOptions = {
  httpOnly: true,
  secure: config.isProd(),
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, role: role || 'child', phone });

    // Auto-create parent profile for parent role
    if (user.role === 'parent') {
      await ParentProfile.create({ user: user._id });
    }

    await AuditLog.create({ actor: user._id, actorRole: user.role, action: 'user.register', success: true });

    const token = signToken(user._id);
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { user: user.toSafeObject(), token },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is suspended. Contact support.' });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    await AuditLog.create({ actor: user._id, actorRole: user.role, action: 'user.login', success: true });

    const token = signToken(user._id);
    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      message: 'Login successful.',
      data: { user: user.toSafeObject(), token },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out.' });
};

exports.me = async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, preferredLanguage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, preferredLanguage },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: { user: user.toSafeObject() } });
  } catch (err) {
    next(err);
  }
};

// ─── Phone + WhatsApp OTP authentication (children) ──────────────────────────
// Children sign in (or sign up) with just their phone number: an OTP is
// delivered on WhatsApp and verifying it issues a normal JWT session.

exports.requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number with country code is required (e.g. +919876543210).',
      });
    }

    // This flow is for children only — parents use WhatsApp directly.
    const existing = await User.findOne({ phone });
    if (existing && existing.role !== 'child') {
      const reason =
        existing.role === 'parent'
          ? 'This is a parent account — parents use WhatsApp directly, no web login needed.'
          : 'This number belongs to a different account type. Please sign in with email and password.';
      return res.status(409).json({ success: false, message: reason });
    }

    // Resend cooldown
    const recent = await OtpVerification.findOne({
      phone,
      purpose: 'child_login',
      status: 'pending',
      createdAt: { $gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    });
    if (recent) {
      return res.status(429).json({
        success: false,
        message: 'An OTP was just sent. Please wait a minute before requesting another one.',
      });
    }

    // Invalidate previous pending codes for this number
    await OtpVerification.updateMany(
      { phone, purpose: 'child_login', status: 'pending' },
      { status: 'expired' }
    );

    const otp = String(crypto.randomInt(100000, 1000000));
    const record = await OtpVerification.create({
      phone,
      otpHash: hashOtp(otp),
      purpose: 'child_login',
      requestedBy: existing?._id,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      await whatsappService.sendOtp(phone, otp);
    } catch (sendErr) {
      record.status = 'expired';
      await record.save();
      console.error('[Auth OTP] WhatsApp send failed:', sendErr.message);
      return res.status(502).json({
        success: false,
        message: 'Could not send the WhatsApp OTP right now. Please try again in a moment.',
      });
    }

    res.status(201).json({
      success: true,
      message: `OTP sent to ${phone} on WhatsApp.`,
      data: {
        phone,
        expiresAt: record.expiresAt,
        existingUser: Boolean(existing),
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

exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
    }

    const record = await OtpVerification.findOne({
      phone,
      purpose: 'child_login',
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

    // ── OTP correct: sign in, or create the child account ──
    let user = await User.findOne({ phone });
    let isNew = false;

    if (user && user.role !== 'child') {
      return res.status(409).json({ success: false, message: 'This number cannot be used for child sign-in.' });
    }

    if (!user) {
      if (!name || !name.trim()) {
        await record.save();
        return res.status(400).json({
          success: false,
          message: 'Welcome! Please enter your name to create your account.',
          data: { needsName: true },
        });
      }

      const digits = phone.replace(/\D/g, '');
      let email = `wa-${digits}@child.careconnect`;
      if (await User.findOne({ email })) {
        email = `wa-${digits}.${crypto.randomBytes(3).toString('hex')}@child.careconnect`;
      }
      user = await User.create({
        name: name.trim(),
        email,
        // Random password — this account signs in with WhatsApp OTP
        password: crypto.randomBytes(16).toString('hex'),
        role: 'child',
        phone,
        phoneVerified: true,
        profileComplete: false,
      });
      isNew = true;
    } else {
      user.phoneVerified = true;
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is suspended. Contact support.' });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    record.status = 'verified';
    record.verifiedAt = new Date();
    await record.save();

    await AuditLog.create({
      actor: user._id,
      actorRole: user.role,
      action: isNew ? 'user.register' : 'user.login',
      success: true,
      details: { method: 'whatsapp_otp' },
    });

    const token = signToken(user._id);
    res.cookie('token', token, cookieOptions);

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Account created.' : 'Login successful.',
      data: { user: user.toSafeObject(), token, isNew },
    });
  } catch (err) {
    next(err);
  }
};
