const User = require('../models/User');
const ServiceProvider = require('../models/ServiceProvider');
const ServiceBooking = require('../models/ServiceBooking');
const RideRequest = require('../models/RideRequest');
const FoodOrder = require('../models/FoodOrder');
const FamilyLink = require('../models/FamilyLink');
const AuditLog = require('../models/AuditLog');
const EmergencyAlert = require('../models/EmergencyAlert');
const config = require('../config');
const whatsappService = require('../services/whatsappService');
const baileysService = require('../services/baileysService');
const { getConnectionStatus } = require('../config/database');

exports.getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: { users, total, page: parseInt(page) } });
  } catch (err) {
    next(err);
  }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    await AuditLog.create({
      actor: req.user._id, actorRole: 'admin',
      action: user.isActive ? 'admin.user.activate' : 'admin.user.suspend',
      resource: 'User', resourceId: user._id,
    });
    res.json({ success: true, data: { user: user.toSafeObject() } });
  } catch (err) {
    next(err);
  }
};

exports.getPendingProviders = async (req, res, next) => {
  try {
    const providers = await ServiceProvider.find({ verificationStatus: 'pending_review' })
      .populate('user', 'name email phone');
    res.json({ success: true, data: { providers } });
  } catch (err) {
    next(err);
  }
};

exports.getAllProviders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;

    const providers = await ServiceProvider.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { providers } });
  } catch (err) {
    next(err);
  }
};

exports.reviewProvider = async (req, res, next) => {
  try {
    const { decision, notes } = req.body; // decision: 'approved' | 'rejected' | 'suspended'
    const allowed = ['approved', 'rejected', 'suspended'];
    if (!allowed.includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision.' });
    }

    const provider = await ServiceProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found.' });

    provider.verificationStatus = decision;
    if (notes !== undefined) provider.adminNotes = notes;
    await provider.save();

    await AuditLog.create({
      actor: req.user._id, actorRole: 'admin',
      action: `admin.provider.${decision}`,
      resource: 'ServiceProvider', resourceId: provider._id,
    });

    res.json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalBookings, pendingProviders, activeAlerts] = await Promise.all([
      User.countDocuments(),
      ServiceBooking.countDocuments(),
      ServiceProvider.countDocuments({ verificationStatus: 'pending_review' }),
      EmergencyAlert.countDocuments({ status: 'active' }),
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalBookings, pendingProviders, activeAlerts },
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      ServiceBooking.find(filter)
        .populate('parent', 'name email')
        .populate('provider', 'businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ServiceBooking.countDocuments(filter),
    ]);

    res.json({ success: true, data: { bookings, total, page: parseInt(page) } });
  } catch (err) {
    next(err);
  }
};

exports.getRides = async (req, res, next) => {
  try {
    const rides = await RideRequest.find()
      .populate('parent', 'name email')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ success: true, data: { rides } });
  } catch (err) {
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await FoodOrder.find()
      .populate('parent', 'name email')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ success: true, data: { orders } });
  } catch (err) {
    next(err);
  }
};

// Manually assign a provider to an unassigned booking (human operator workflow)
exports.assignBooking = async (req, res, next) => {
  try {
    const { providerId } = req.body;
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'Only requested bookings can be assigned.' });
    }

    const provider = await ServiceProvider.findOne({ _id: providerId, verificationStatus: 'approved' });
    if (!provider) return res.status(404).json({ success: false, message: 'Approved provider not found.' });

    booking.provider = provider._id;
    await booking.save();

    await AuditLog.create({
      actor: req.user._id, actorRole: 'admin',
      action: 'admin.booking.assign',
      resource: 'ServiceBooking', resourceId: booking._id,
    });

    res.json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

/** Aggregated WhatsApp status for the admin integrations screen. */
const buildWhatsappStatus = () => {
  const wa = whatsappService.getStatus();
  const status = {
    status: wa.isDemo ? 'demo_mode' : 'configured',
    provider: wa.provider === 'demo' ? null : wa.provider,
    mode: wa.mode,
    preference: wa.preference,
    configured: wa.configured,
    missing: wa.missing,
    notice: wa.isDemo
      ? wa.configured
        ? 'DEMO MODE is switched on. Live credentials are present but no real WhatsApp messages are being sent.'
        : 'DEMO MODE: No real WhatsApp messages will be sent.'
      : null,
  };

  // Baileys (WhatsApp Web) — live link state for the QR scanner UI.
  if (wa.provider === 'baileys') {
    const channel = baileysService.getStatus();
    status.channel = {
      state: channel.state,
      phone: channel.phone,
      since: channel.since,
      lastError: channel.lastError,
      sessionExists: channel.sessionExists,
      hasQr: Boolean(channel.qr),
    };
  }

  return status;
};

exports.getIntegrationStatus = async (req, res) => {
  const dbStatus = getConnectionStatus();

  res.json({
    success: true,
    data: {
      database: {
        status: dbStatus.connected ? 'connected' : 'unavailable',
        label: dbStatus.label,
      },
      whatsapp: buildWhatsappStatus(),
      ai: {
        status: config.ai.provider ? 'configured' : 'fallback_mode',
        provider: config.ai.provider || null,
        notice: config.ai.provider ? null : 'Using deterministic fallback. No LLM calls.',
      },
      maps: {
        status: config.maps.provider ? 'configured' : 'unavailable',
        provider: config.maps.provider || null,
      },
      email: {
        status: config.email.provider ? 'configured' : 'simulated',
        provider: config.email.provider || null,
      },
      rideProvider: {
        status: 'demo_mode',
        providers: ['Ola', 'Uber', 'Rapido'],
        notice:
          'No public ride-hailing API available. Price comparison is simulated (DEMO refs); real bookings are handed off via deep links that open the provider app with the trip pre-filled.',
        handoff: 'enabled',
      },
      foodProvider: {
        status: 'demo_mode',
        providers: ['Zomato-style demo catalogue'],
        notice:
          'No public consumer food-ordering API available. Orders are simulated (DEMO refs); real ordering is handed off to Swiggy / Zomato with direct links.',
        handoff: 'enabled',
      },
      householdProviders: {
        status: 'demo_mode',
        providers: ['Urban Company (Demo)', 'Verified local providers'],
        notice: 'Urban Company has no public API. Demo bookings plus real local provider records.',
      },
    },
  });
};

/**
 * POST /api/admin/whatsapp/mode  { mode: 'demo' | 'live' }
 * Flips the WhatsApp sending mode at runtime (admin toggle in the UI).
 */
exports.setWhatsappMode = async (req, res, next) => {
  try {
    const { mode } = req.body || {};
    const status = whatsappService.setMode(mode);

    AuditLog.create({
      actor: req.user._id,
      actorRole: 'admin',
      action: `admin.whatsapp.mode.${status.mode}`,
      resource: 'WhatsApp',
      details: { mode: status.mode, provider: status.provider },
    }).catch(() => {}); // audit must never break the toggle itself

    res.json({ success: true, data: { whatsapp: status } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/whatsapp/channel
 * Baileys link state + QR (data-URL) for the admin scanner UI. Poll this while
 * the QR is on screen — WhatsApp refreshes the code periodically.
 */
exports.getWhatsappChannel = async (req, res) => {
  res.json({ success: true, data: baileysService.getStatus() });
};

/**
 * POST /api/admin/whatsapp/channel/restart
 * Drops the current WhatsApp Web socket and pairs again (fresh QR).
 */
exports.restartWhatsappChannel = async (req, res, next) => {
  try {
    const status = await baileysService.restart();

    AuditLog.create({
      actor: req.user._id,
      actorRole: 'admin',
      action: 'admin.whatsapp.channel.restart',
      resource: 'WhatsApp',
      details: { state: status.state },
    }).catch(() => {});

    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/whatsapp/channel/send  { to, text }
 * Real end-to-end send test through the current mode/provider.
 */
exports.sendWhatsappTest = async (req, res, next) => {
  try {
    const to = String(req.body?.to || '').trim();
    const text = String(req.body?.text || '').trim();
    if (!to || !text) {
      return res.status(400).json({ success: false, message: 'to and text are required.' });
    }

    const result = await whatsappService.sendMessage(to, text);
    res.json({
      success: true,
      data: result,
      ...(result.demo ? { notice: 'Simulated (demo mode) — no real WhatsApp message was sent.' } : {}),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find().populate('actor', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      AuditLog.countDocuments(),
    ]);
    res.json({ success: true, data: { logs, total, page: parseInt(page) } });
  } catch (err) {
    next(err);
  }
};
