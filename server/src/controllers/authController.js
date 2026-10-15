const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const ParentProfile = require('../models/ParentProfile');
const AuditLog = require('../models/AuditLog');
const config = require('../config');

const signToken = (userId) =>
  jwt.sign({ id: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

const cookieOptions = {
  httpOnly: true,
  secure: config.isProd(),
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

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
