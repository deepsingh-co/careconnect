const ServiceProvider = require('../models/ServiceProvider');
const ServiceBooking = require('../models/ServiceBooking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ── Provider Profile ──────────────────────────────────────────────────────────
exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await ServiceProvider.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!profile) return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const allowed = ['businessName', 'services', 'serviceArea', 'availability', 'pricing'];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const profile = await ServiceProvider.findOneAndUpdate(
      { user: req.user._id },
      update,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

// ── Provider Jobs ─────────────────────────────────────────────────────────────
exports.getMyJobs = async (req, res, next) => {
  try {
    const providerProfile = await ServiceProvider.findOne({ user: req.user._id });
    if (!providerProfile) return res.status(404).json({ success: false, message: 'Provider profile not found.' });

    if (providerProfile.verificationStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'Account pending verification.' });
    }

    const { status } = req.query;
    const filter = { provider: providerProfile._id };
    if (status) filter.status = status;

    const jobs = await ServiceBooking.find(filter)
      .select('-serviceAddress.line1') // Don't expose full address until accepted
      .sort({ scheduledAt: 1 });

    res.json({ success: true, data: { jobs } });
  } catch (err) {
    next(err);
  }
};

exports.acceptJob = async (req, res, next) => {
  try {
    const providerProfile = await ServiceProvider.findOne({ user: req.user._id });
    const booking = await ServiceBooking.findOne({ _id: req.params.id, provider: providerProfile?._id });

    if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (booking.status !== 'requested') return res.status(400).json({ success: false, message: 'Job is no longer available.' });

    booking.status = 'accepted';
    booking.providerAcceptedAt = new Date();
    await booking.save();

    await Notification.create({
      recipient: booking.parent,
      type: 'booking_accepted',
      title: 'Service request accepted',
      body: `Your ${booking.serviceCategory.replace(/_/g, ' ')} request has been accepted.`,
      data: { bookingId: booking._id },
    });

    res.json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

exports.rejectJob = async (req, res, next) => {
  try {
    const providerProfile = await ServiceProvider.findOne({ user: req.user._id });
    const booking = await ServiceBooking.findOne({ _id: req.params.id, provider: providerProfile?._id });

    if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });

    booking.status = 'requested'; // Back to unassigned
    booking.provider = null;
    await booking.save();

    res.json({ success: true, message: 'Job rejected. It will be reassigned.' });
  } catch (err) {
    next(err);
  }
};

exports.updateJobStatus = async (req, res, next) => {
  try {
    const providerProfile = await ServiceProvider.findOne({ user: req.user._id });
    const booking = await ServiceBooking.findOne({ _id: req.params.id, provider: providerProfile?._id });

    if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });

    const validTransitions = {
      accepted: ['in_progress'],
      in_progress: ['completed'],
    };

    const allowed = validTransitions[booking.status] || [];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: `Cannot transition from ${booking.status} to ${req.body.status}.` });
    }

    booking.status = req.body.status;
    if (req.body.status === 'in_progress') booking.providerArrivedAt = new Date();
    if (req.body.status === 'completed') booking.completedAt = new Date();
    await booking.save();

    const eventLabel = req.body.status === 'in_progress' ? 'worker_arrived' : 'booking_completed';
    await Notification.create({
      recipient: booking.parent,
      type: eventLabel,
      title: req.body.status === 'in_progress' ? 'Worker has arrived' : 'Service completed',
      body: req.body.status === 'in_progress'
        ? 'Your service worker has arrived.'
        : `Your ${booking.serviceCategory.replace(/_/g, ' ')} service has been completed.`,
      data: { bookingId: booking._id },
    });

    res.json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};
