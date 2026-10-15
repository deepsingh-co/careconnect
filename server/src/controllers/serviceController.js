const ServiceBooking = require('../models/ServiceBooking');
const RideRequest = require('../models/RideRequest');
const FoodOrder = require('../models/FoodOrder');
const ServiceProvider = require('../models/ServiceProvider');
const Notification = require('../models/Notification');
const FamilyLink = require('../models/FamilyLink');
const { resolveParentId } = require('../utils/authHelpers');

// ── Service Categories ────────────────────────────────────────────────────────
exports.getServiceCategories = async (req, res) => {
  const categories = [
    { id: 'home_cleaning', label: 'Home Cleaning', icon: 'home', basePrice: 499 },
    { id: 'deep_cleaning', label: 'Deep Cleaning', icon: 'sparkles', basePrice: 1499 },
    { id: 'gardening', label: 'Gardening', icon: 'flower', basePrice: 399 },
    { id: 'car_wash', label: 'Car Wash', icon: 'car', basePrice: 299 },
    { id: 'plumbing', label: 'Plumbing', icon: 'wrench', basePrice: 599 },
    { id: 'electrical', label: 'Electrical', icon: 'zap', basePrice: 599 },
    { id: 'other_home_service', label: 'Other Home Service', icon: 'tool', basePrice: null },
  ];
  res.json({ success: true, data: { categories } });
};

// ── Providers ─────────────────────────────────────────────────────────────────
exports.getProviders = async (req, res, next) => {
  try {
    const { service } = req.query;
    const filter = { verificationStatus: 'approved' };
    if (service) filter.services = service;

    const providers = await ServiceProvider.find(filter)
      .populate('user', 'name phone')
      .select('-adminNotes');

    res.json({ success: true, data: { providers } });
  } catch (err) {
    next(err);
  }
};

// ── Service Bookings ──────────────────────────────────────────────────────────
exports.createBooking = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const booking = await ServiceBooking.create({
      ...req.body,
      parent: parentId,
      requestedBy: req.user._id,
      status: 'requested',
    });

    // Notify family
    await _notifyFamily(parentId, {
      type: 'booking_new',
      title: 'New service booking',
      body: `A ${booking.serviceCategory.replace(/_/g, ' ')} has been requested.`,
      data: { bookingId: booking._id },
    });

    res.status(201).json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const { status, category, page = 1, limit = 20 } = req.query;
    const filter = { parent: parentId };
    if (status) filter.status = status;
    if (category) filter.serviceCategory = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      ServiceBooking.find(filter)
        .populate('provider', 'businessName')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ServiceBooking.countDocuments(filter),
    ]);

    res.json({ success: true, data: { bookings, page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    next(err);
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    const booking = await ServiceBooking.findOne({
      _id: req.params.id,
      parent: parentId,
    }).populate('provider', 'businessName pricing');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    res.json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Authorization
    const isParent = booking.parent.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isParent && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    booking.status = status;
    if (notes) booking.notes = notes;
    if (status === 'completed') booking.completedAt = new Date();
    await booking.save();

    res.json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const cancellable = ['requested', 'accepted', 'awaiting_confirmation'];
    if (!cancellable.includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking cannot be cancelled at this stage.' });
    }

    const isParent = booking.parent.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isParent && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by user.';
    await booking.save();

    await _notifyFamily(booking.parent, {
      type: 'booking_cancelled',
      title: 'Booking cancelled',
      body: `Your ${booking.serviceCategory.replace(/_/g, ' ')} booking has been cancelled.`,
      data: { bookingId: booking._id },
    });

    res.json({ success: true, message: 'Booking cancelled.', data: { booking } });
  } catch (err) {
    next(err);
  }
};

// ── Ride Requests ──────────────────────────────────────────────────────────────
exports.createRide = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const ride = await RideRequest.create({
      ...req.body,
      parent: parentId,
      requestedBy: req.user._id,
      isDemo: true, // No live ride provider configured
    });

    await _notifyFamily(parentId, {
      type: 'booking_new',
      title: 'Ride requested',
      body: `A ride to ${ride.destination.address} has been requested.`,
      data: { rideId: ride._id },
    });

    res.status(201).json({ success: true, data: { ride }, demoMode: true });
  } catch (err) {
    next(err);
  }
};

exports.getRides = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const rides = await RideRequest.find({ parent: parentId }).sort({ scheduledAt: -1 }).limit(50);
    res.json({ success: true, data: { rides } });
  } catch (err) {
    next(err);
  }
};

exports.cancelRide = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    const ride = await RideRequest.findOne({ _id: req.params.id, parent: parentId });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    const cancellable = ['draft', 'awaiting_details', 'awaiting_confirmation', 'requested', 'accepted'];
    if (!cancellable.includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Ride cannot be cancelled at this stage.' });
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    await ride.save();

    await _notifyFamily(ride.parent, {
      type: 'booking_cancelled',
      title: 'Ride cancelled',
      body: `Your ride to ${ride.destination.address} was cancelled.`,
      data: { rideId: ride._id },
    });

    res.json({ success: true, message: 'Ride cancelled.', data: { ride } });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    const order = await FoodOrder.findOne({ _id: req.params.id, parent: parentId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const cancellable = ['draft', 'awaiting_confirmation', 'placed', 'preparing'];
    if (!cancellable.includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order can no longer be cancelled.' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.reason || 'Cancelled by user.';
    await order.save();

    res.json({ success: true, message: 'Order cancelled.', data: { order } });
  } catch (err) {
    next(err);
  }
};

// ── Food Orders ───────────────────────────────────────────────────────────────
exports.getMenu = async (req, res) => {
  // Demo catalogue — no real food provider configured
  const menu = [
    { id: 'm1', name: 'Dal Khichdi', category: 'meals', price: 120, description: 'Light and healthy rice and lentil dish.' },
    { id: 'm2', name: 'Idli Sambhar (4 pcs)', category: 'breakfast', price: 80, description: 'Steamed rice cakes with sambhar.' },
    { id: 'm3', name: 'Poha', category: 'breakfast', price: 60, description: 'Flattened rice with vegetables.' },
    { id: 'm4', name: 'Vegetable Soup', category: 'soups', price: 75, description: 'Warm vegetable broth.' },
    { id: 'm5', name: 'Roti with Sabzi', category: 'meals', price: 100, description: 'Whole wheat roti with seasonal vegetable curry.' },
    { id: 'm6', name: 'Curd Rice', category: 'meals', price: 90, description: 'Cooling curd mixed with rice.' },
    { id: 'm7', name: 'Fresh Fruit Bowl', category: 'snacks', price: 80, description: 'Seasonal fresh fruits.' },
    { id: 'm8', name: 'Green Tea', category: 'beverages', price: 30, description: 'Antioxidant-rich green tea.' },
  ];
  res.json({ success: true, data: { menu, demoMode: true, notice: 'This is a demo catalogue. No real order will be placed.' } });
};

exports.createOrder = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const order = await FoodOrder.create({
      ...req.body,
      parent: parentId,
      requestedBy: req.user._id,
      isDemo: true,
      status: 'placed',
    });

    res.status(201).json({
      success: true,
      data: { order },
      demoMode: true,
      notice: 'Demo mode: no real order was placed with any restaurant or delivery service.',
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const parentId = await resolveParentId(req);
    if (!parentId) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const orders = await FoodOrder.find({ parent: parentId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: { orders } });
  } catch (err) {
    next(err);
  }
};

// ── Private helpers ───────────────────────────────────────────────────────────
async function _notifyFamily(parentId, notifData) {
  const links = await FamilyLink.find({ parent: parentId, status: 'active' }).select('child');
  const notifications = links.map((link) => ({
    recipient: link.child,
    ...notifData,
  }));
  if (notifications.length) await Notification.insertMany(notifications);
}
