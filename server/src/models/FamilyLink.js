const mongoose = require('mongoose');

const familyLinkSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'revoked'],
      default: 'pending',
    },
    invitationCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    invitationExpiresAt: Date,
    consentGivenAt: Date,
    consentRevoked: { type: Boolean, default: false },
    permissions: {
      viewMedications: { type: Boolean, default: true },
      viewBookings: { type: Boolean, default: true },
      viewCheckins: { type: Boolean, default: true },
      manageBookings: { type: Boolean, default: true },
      receiveAlerts: { type: Boolean, default: true },
    },
    /**
     * Child-controlled per-category auto-approval.
     *
     * Daily items (grocery) default to ON so a parent's routine "doodh aur
     * poha" request is never blocked waiting for a child. Every other
     * category is opt-in. Turning a category off restores the normal
     * WhatsApp / in-app Approve-Decline flow for that category.
     */
    autoApprove: {
      food: { type: Boolean, default: false },
      ride: { type: Boolean, default: false },
      home_service: { type: Boolean, default: false },
      grocery: { type: Boolean, default: true },
      medicine: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

familyLinkSchema.index({ parent: 1, child: 1 }, { unique: true });

module.exports = mongoose.model('FamilyLink', familyLinkSchema);
