const MedicineReminder = require('../models/MedicineReminder');
const ReminderEvent = require('../models/ReminderEvent');
const FamilyLink = require('../models/FamilyLink');
const Notification = require('../models/Notification');
const { resolveParentId } = require('../utils/authHelpers');

exports.getReminders = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const reminders = await MedicineReminder.find({ parent: parentId }).sort({ createdAt: -1 });
    res.json({ success: true, data: { reminders } });
  } catch (err) {
    next(err);
  }
};

exports.createReminder = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const reminder = await MedicineReminder.create({
      ...req.body,
      parent: parentId,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: { reminder } });
  } catch (err) {
    next(err);
  }
};

exports.updateReminder = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    const reminder = await MedicineReminder.findOne({ _id: req.params.id, parent: parentId });

    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });

    Object.assign(reminder, req.body);
    await reminder.save();

    res.json({ success: true, data: { reminder } });
  } catch (err) {
    next(err);
  }
};

exports.acknowledgeReminder = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { acknowledgement } = req.body;

    const validAcks = ['taken', 'remind_later', 'need_help'];
    if (!validAcks.includes(acknowledgement)) {
      return res.status(400).json({ success: false, message: 'Invalid acknowledgement value.' });
    }

    const event = await ReminderEvent.findById(eventId).populate('reminder');
    if (!event) return res.status(404).json({ success: false, message: 'Reminder event not found.' });

    // Verify the user is authorized: parent owner, linked family caregiver, or admin
    let allowed = req.user.role === 'admin' || event.parent.toString() === req.user._id.toString();
    if (!allowed && req.user.role === 'child') {
      const link = await FamilyLink.findOne({
        parent: event.parent,
        child: req.user._id,
        status: 'active',
      });
      allowed = !!link;
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    event.acknowledgement = acknowledgement;
    event.acknowledgedAt = new Date();
    await event.save();

    if (acknowledgement === 'need_help') {
      // Notify family members
      const links = await FamilyLink.find({ parent: event.parent, status: 'active' }).select('child');
      for (const link of links) {
        await Notification.create({
          recipient: link.child,
          type: 'reminder_missed',
          title: 'Parent needs help with medication',
          body: `${event.reminder?.medicineName || 'Medication'} reminder: parent indicated they need help.`,
          data: { eventId: event._id },
        });
      }
    }

    res.json({ success: true, message: 'Acknowledgement recorded.', data: { event } });
  } catch (err) {
    next(err);
  }
};

exports.getReminderHistory = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const events = await ReminderEvent.find({ parent: parentId })
      .populate('reminder', 'medicineName')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ReminderEvent.countDocuments({ parent: parentId });

    res.json({ success: true, data: { events, page, limit, total } });
  } catch (err) {
    next(err);
  }
};
