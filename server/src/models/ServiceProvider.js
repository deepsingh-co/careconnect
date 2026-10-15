const mongoose = require('mongoose');

const serviceProviderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: { type: String, trim: true },
    services: [
      {
        type: String,
        enum: [
          'home_cleaning',
          'deep_cleaning',
          'gardening',
          'car_wash',
          'plumbing',
          'electrical',
          'ride',
          'food_delivery',
          'other_home_service',
        ],
      },
    ],
    serviceArea: {
      cities: [String],
      pincodes: [String],
      radiusKm: Number,
    },
    availability: {
      mon: { type: Boolean, default: true },
      tue: { type: Boolean, default: true },
      wed: { type: Boolean, default: true },
      thu: { type: Boolean, default: true },
      fri: { type: Boolean, default: true },
      sat: { type: Boolean, default: true },
      sun: { type: Boolean, default: false },
      workingHours: {
        start: { type: String, default: '08:00' },
        end: { type: String, default: '18:00' },
      },
    },
    pricing: {
      currency: { type: String, default: 'INR' },
      hourlyRate: Number,
      visitRate: Number,
      notes: String,
    },
    verificationStatus: {
      type: String,
      enum: ['pending_review', 'approved', 'suspended', 'rejected'],
      default: 'pending_review',
      index: true,
    },
    idVerified: { type: Boolean, default: false },
    backgroundCheckPassed: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
    adminNotes: String,
  },
  { timestamps: true }
);

serviceProviderSchema.index({ services: 1, verificationStatus: 1 });

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
