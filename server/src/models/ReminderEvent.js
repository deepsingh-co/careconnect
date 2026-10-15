const mongoose = require('mongoose');

const reminderEventSchema = new mongoose.Schema(
  {
    reminder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineReminder',
      required: true,
      index: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scheduledAt: { type: Date, required: true, index: true },
    sentAt: Date,
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending',
    },
    acknowledgement: {
      type: String,
      enum: ['taken', 'remind_later', 'need_help', 'missed', null],
      default: null,
    },
    acknowledgedAt: Date,
    followUpCount: { type: Number, default: 0 },
    familyAlertSent: { type: Boolean, default: false },
    familyAlertSentAt: Date,
    idempotencyKey: { type: String, unique: true, sparse: true }, // prevents duplicate jobs
  },
  { timestamps: true }
);

reminderEventSchema.index({ reminder: 1, scheduledAt: 1 });

module.exports = mongoose.model('ReminderEvent', reminderEventSchema);
