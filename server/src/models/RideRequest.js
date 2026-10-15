const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema(
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
    pickup: {
      address: { type: String, required: true },
      coordinates: { lat: Number, lng: Number },
    },
    destination: {
      address: { type: String, required: true },
      coordinates: { lat: Number, lng: Number },
    },
    scheduledAt: { type: Date, required: true },
    specialInstructions: { type: String, maxlength: 300 },
    status: {
      type: String,
      enum: [
        'draft',
        'awaiting_details',
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
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceProvider',
    },
    estimatedFare: Number,
    finalFare: Number,
    driverName: String,
    driverPhone: String,
    vehicleDetails: String,
    parentConfirmedAt: Date,
    acceptedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    isDemo: { type: Boolean, default: false },
    sourceChannel: {
      type: String,
      enum: ['whatsapp', 'dashboard', 'api'],
      default: 'dashboard',
    },
  },
  { timestamps: true }
);

rideRequestSchema.index({ parent: 1, scheduledAt: -1 });

module.exports = mongoose.model('RideRequest', rideRequestSchema);
