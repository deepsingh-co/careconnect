const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    triggeredBy: {
      type: String,
      enum: ['whatsapp', 'dashboard', 'system'],
      default: 'whatsapp',
    },
    message: { type: String, maxlength: 500 },
    assistanceType: {
      type: String,
      enum: ['medical', 'fall', 'fire', 'other', 'unknown'],
      default: 'unknown',
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved', 'false_alarm'],
      default: 'active',
      index: true,
    },
    contactsNotified: [
      {
        name: String,
        phone: String,
        notifiedAt: Date,
        method: String,
        status: String,
      },
    ],
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date,
    resolvedAt: Date,
    notes: { type: String, maxlength: 500 },
    // CareConnect does NOT dispatch emergency services.
    // This alert is for family notification only.
    disclaimer: {
      type: String,
      default:
        'This alert notifies family members only. For medical emergencies call 112 immediately.',
    },
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ parent: 1, status: 1 });

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
