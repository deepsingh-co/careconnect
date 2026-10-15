const WellnessCheckin = require('../models/WellnessCheckin');
const FamilyLink = require('../models/FamilyLink');
const Notification = require('../models/Notification');
const { resolveParentId } = require('../utils/authHelpers');

exports.createCheckin = async (req, res, next) => {
  try {
    const parentId = req.user.role === 'parent' ? req.user._id : await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const { mood, note } = req.body;
    const valid = ['great', 'good', 'okay', 'not_well', 'need_help'];
    if (!mood || !valid.includes(mood)) {
      return res.status(400).json({ success: false, message: 'Valid mood is required.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkin = await WellnessCheckin.create({
      parent: parentId,
      scheduledAt: new Date(),
      sentAt: new Date(),
      responseAt: new Date(),
      status: 'responded',
      mood,
      note: note?.slice(0, 500),
      checkinType: today.getHours() < 12 ? 'morning' : 'evening',
      idempotencyKey: `checkin_${parentId}_${today.toISOString().slice(0, 10)}`,
    });

    // Notify family on "need_help"
    if (mood === 'need_help') {
      const links = await FamilyLink.find({ parent: parentId, status: 'active' }).select('child');
      await Notification.insertMany(
        links.map((l) => ({
          recipient: l.child,
          type: 'checkin_missed',
          title: 'Parent needs attention',
          body: `Your parent reported they need help in their wellness check-in.${note ? ' Note: ' + note : ''}`,
          data: { checkinId: checkin._id },
        }))
      );
    }

    res.status(201).json({ success: true, data: { checkin } });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ success: true, message: 'Check-in already recorded today.' });
    }
    next(err);
  }
};

exports.getCheckins = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const checkins = await WellnessCheckin.find({ parent: parentId })
      .sort({ scheduledAt: -1 })
      .limit(60);

    res.json({ success: true, data: { checkins } });
  } catch (err) {
    next(err);
  }
};
