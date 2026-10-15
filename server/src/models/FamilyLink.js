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
  },
  { timestamps: true }
);

familyLinkSchema.index({ parent: 1, child: 1 }, { unique: true });

module.exports = mongoose.model('FamilyLink', familyLinkSchema);
