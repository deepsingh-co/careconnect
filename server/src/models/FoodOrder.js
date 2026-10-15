const mongoose = require('mongoose');

const foodOrderSchema = new mongoose.Schema(
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
    items: [
      {
        itemId: String,
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: Number,
      },
    ],
    deliveryAddress: {
      line1: String,
      city: String,
      pincode: String,
    },
    deliveryTime: Date,
    specialInstructions: { type: String, maxlength: 300 },
    estimatedTotal: Number,
    restaurantName: String,
    demoBookingRef: String,
    status: {
      type: String,
      enum: [
        'draft',
        'awaiting_confirmation',
        'placed',
        'preparing',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'failed',
      ],
      default: 'placed',
      index: true,
    },
    parentConfirmedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    isDemo: { type: Boolean, default: true },
    sourceChannel: {
      type: String,
      enum: ['whatsapp', 'dashboard', 'api'],
      default: 'dashboard',
    },
  },
  { timestamps: true }
);

foodOrderSchema.index({ parent: 1, createdAt: -1 });

module.exports = mongoose.model('FoodOrder', foodOrderSchema);
