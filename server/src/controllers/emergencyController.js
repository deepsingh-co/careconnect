const EmergencyAlert = require('../models/EmergencyAlert');
const FamilyLink = require('../models/FamilyLink');
const Notification = require('../models/Notification');
const ParentProfile = require('../models/ParentProfile');
const { resolveParentId } = require('../utils/authHelpers');

exports.createAlert = async (req, res, next) => {
  try {
    const parentId = req.user.role === 'parent' ? req.user._id : await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const alert = await EmergencyAlert.create({
      parent: parentId,
      triggeredBy: req.body.triggeredBy || 'dashboard',
      message: req.body.message,
      assistanceType: req.body.assistanceType || 'unknown',
    });

    // Get parent's emergency contacts
    const profile = await ParentProfile.findOne({ user: parentId });
    const emergencyContacts = profile?.emergencyContacts || [];

    // Notify family members via in-app
    const links = await FamilyLink.find({ parent: parentId, status: 'active' }).select('child');
    const notifications = links.map((link) => ({
      recipient: link.child,
      type: 'emergency_alert',
      title: 'EMERGENCY ALERT',
      body: `Your parent has triggered an emergency alert.${req.body.message ? ' Message: ' + req.body.message : ''} Please contact them immediately. For medical emergencies, call 112.`,
      data: { alertId: alert._id },
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    // Record that emergency contacts were notified (manual/configured only)
    alert.contactsNotified = emergencyContacts.map((c) => ({
      name: c.name,
      phone: c.phone,
      notifiedAt: new Date(),
      method: 'in_app',
      status: 'queued',
    }));
    await alert.save();

    res.status(201).json({
      success: true,
      message: 'Emergency alert sent to family members.',
      data: { alert },
      disclaimer:
        'CareConnect notifies family members only. For life-threatening emergencies, call 112 immediately. CareConnect does not dispatch emergency services.',
    });
  } catch (err) {
    next(err);
  }
};

exports.getAlerts = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    const filter = parentId ? { parent: parentId } : {};
    if (req.query.status) filter.status = req.query.status;

    const alerts = await EmergencyAlert.find(filter)
      .populate('parent', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: { alerts } });
  } catch (err) {
    next(err);
  }
};

exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });

    alert.status = req.body.resolution || 'acknowledged';
    alert.acknowledgedBy = req.user._id;
    alert.acknowledgedAt = new Date();
    if (req.body.notes) alert.notes = req.body.notes;
    await alert.save();

    res.json({ success: true, data: { alert } });
  } catch (err) {
    next(err);
  }
};
