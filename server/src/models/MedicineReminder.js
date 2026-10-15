const mongoose = require('mongoose');

const medicineReminderSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicineName: { type: String, required: true, trim: true },
    instructions: {
      type: String,
      maxlength: 500,
      // Entered from authorized prescription. CareConnect does not generate dosage.
    },
    schedule: [
      {
        time: { type: String, required: true }, // "HH:MM"
        label: String, // "Morning", "Afternoon", etc.
      },
    ],
    timezone: { type: String, default: 'Asia/Kolkata' },
    recurrence: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'daily',
    },
    activeDays: {
      // For weekly/custom: ["mon","tue","wed","thu","fri","sat","sun"]
      type: [String],
      default: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    isActive: { type: Boolean, default: true, index: true },
    followUpAfterMinutes: { type: Number, default: 30 },
    maxFollowUps: { type: Number, default: 2 },
    notifyFamilyAfterMissed: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

medicineReminderSchema.index({ parent: 1, isActive: 1 });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);
