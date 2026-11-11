const mongoose = require('mongoose');

/**
 * A parent-initiated request that must be approved by a linked child before
 * CareConnect places the order / booking.
 *
 * Flow:
 *   parent WhatsApp message → ApprovalRequest (pending) → child WhatsApp
 *   Approve/Decline → approved = order placed + delivery OTP sent to parent.
 */
const approvalRequestSchema = new mongoose.Schema(
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
    },
    type: {
      type: String,
      enum: ['food', 'ride', 'home_service', 'grocery', 'medicine'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'approved', 'declined', 'expired', 'failed'],
      default: 'pending',
      index: true,
    },
    /** Short code shown to the child: APPROVE ABC123 / DECLINE ABC123. */
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 500,
    },
    amount: Number,
    currency: { type: String, default: 'INR' },
    details: mongoose.Schema.Types.Mixed,
    sourceChannel: {
      type: String,
      enum: ['whatsapp', 'dashboard', 'api'],
      default: 'whatsapp',
    },
    sourceMessage: { type: String, maxlength: 1000 },
    language: {
      type: String,
      enum: ['en', 'hi', 'hinglish'],
      default: 'en',
    },
    expiresAt: { type: Date, required: true, index: true },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    declineReason: { type: String, maxlength: 300 },
    resultType: String,
    resultId: mongoose.Schema.Types.ObjectId,
    resultRef: String,
    deliveryPartner: {
      role: String,
      name: String,
      phone: String,
      vehicle: String,
      etaMinutes: Number,
      arrivalWindow: String,
    },
    /** Delivery OTP is only ever stored as a hash. The parent gets the code. */
    deliveryOtpHash: String,
    deliveryOtpExpiresAt: Date,
    deliveryOtpAttempts: { type: Number, default: 0 },
    deliveryOtpLockedUntil: Date,
    /** Set once the delivery partner verifies the OTP at handover. */
    deliveryVerifiedAt: Date,
    /**
     * Delivery-partner handoff link. Only the SHA-256 hash of the token is
     * stored; the raw link is returned once when it is issued.
     */
    handoffTokenHash: { type: String, index: true },
    handoffTokenExpiresAt: Date,
    handoffOpenedAt: Date,
    parentNotifiedAt: Date,
  },
  { timestamps: true }
);

approvalRequestSchema.index({ parent: 1, status: 1, createdAt: -1 });
approvalRequestSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
