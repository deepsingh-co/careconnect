const mongoose = require('mongoose');

const parentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    emergencyContacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relationship: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    medicalNotes: {
      type: String,
      maxlength: [1000, 'Medical notes too long'],
      // Only visible to authorized family and admin
    },
    reminderPreferences: {
      morningCheckIn: { type: String, default: '08:00' },
      eveningCheckIn: { type: String, default: '19:00' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      wantsWhatsappReminders: { type: Boolean, default: true },
    },
    notificationSettings: {
      notifyFamilyOnMissedCheckin: { type: Boolean, default: true },
      notifyFamilyOnEmergency: { type: Boolean, default: true },
      notifyFamilyOnBooking: { type: Boolean, default: true },
      checkInGracePeriodMinutes: { type: Number, default: 30 },
    },
    whatsappNumber: String,
    whatsappVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParentProfile', parentProfileSchema);
