const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceProvider',
    },
    serviceCategory: {
      type: String,
      enum: [
        'home_cleaning',
        'deep_cleaning',
        'gardening',
        'car_wash',
        'plumbing',
        'electrical',
        'other_home_service',
      ],
      required: true,
    },
    description: { type: String, maxlength: 500 },
    scheduledAt: { type: Date, required: true },
    durationHours: { type: Number, min: 0.5, max: 12 },
    serviceType: {
      type: String,
      enum: ['one_time', 'hourly', 'recurring'],
      default: 'one_time',
    },
    recurrence: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      },
      endsAt: Date,
    },
    serviceAddress: {
      line1: String,
      city: String,
      pincode: String,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'awaiting_confirmation',
        'requested',
        'accepted',
        'in_progress',
        'completed',
        'cancelled',
        'failed',
      ],
      default: 'requested',
      index: true,
    },
    estimatedPrice: Number,
    finalPrice: Number,
    parentConfirmedAt: Date,
    providerAcceptedAt: Date,
    providerArrivedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    isDemo: { type: Boolean, default: false },
    sourceChannel: {
      type: String,
      enum: ['whatsapp', 'dashboard', 'api'],
      default: 'dashboard',
    },
    notes: String,
  },
  { timestamps: true }
);

serviceBookingSchema.index({ parent: 1, status: 1 });
serviceBookingSchema.index({ provider: 1, status: 1 });
serviceBookingSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
