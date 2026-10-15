const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'booking_new',
        'booking_accepted',
        'booking_rejected',
        'booking_cancelled',
        'booking_completed',
        'worker_arrived',
        'reminder_due',
        'reminder_missed',
        'checkin_missed',
        'emergency_alert',
        'family_invitation',
        'family_link_accepted',
        'system',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed,
    channels: {
      inApp: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
    },
    deliveryStatus: {
      inApp: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending' },
      whatsapp: { type: String, enum: ['pending', 'sent', 'delivered', 'failed', 'skipped'] },
      email: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'] },
    },
    readAt: Date,
    isRead: { type: Boolean, default: false, index: true },
    idempotencyKey: String,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ idempotencyKey: 1 }, { sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);
