const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['parent_link', 'child_login'],
      default: 'parent_link',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    parentDetails: {
      name: { type: String, trim: true, maxlength: 100 },
      relationship: { type: String, trim: true, maxlength: 50 },
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ['pending', 'verified', 'expired', 'locked'],
      default: 'pending',
    },
    verifiedAt: Date,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-remove records once expired
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);
