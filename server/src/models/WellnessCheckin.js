const mongoose = require('mongoose');

const wellnessCheckinSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scheduledAt: { type: Date, required: true },
    sentAt: Date,
    responseAt: Date,
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'responded', 'missed', 'skipped'],
      default: 'scheduled',
      index: true,
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'not_well', 'need_help', null],
      default: null,
    },
    note: { type: String, maxlength: 500 },
    familyAlertSent: { type: Boolean, default: false },
    checkinType: {
      type: String,
      enum: ['morning', 'evening', 'custom'],
      default: 'morning',
    },
    idempotencyKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

wellnessCheckinSchema.index({ parent: 1, scheduledAt: -1 });

module.exports = mongoose.model('WellnessCheckin', wellnessCheckinSchema);
