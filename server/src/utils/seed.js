/**
 * CareConnect Demo Seed Script
 * Creates clearly fictional demo data for development and testing.
 * None of these are real people, medical records or provider identities.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const User = require('../models/User');
const ParentProfile = require('../models/ParentProfile');
const FamilyLink = require('../models/FamilyLink');
const ServiceProvider = require('../models/ServiceProvider');
const MedicineReminder = require('../models/MedicineReminder');
const ServiceBooking = require('../models/ServiceBooking');
const RideRequest = require('../models/RideRequest');
const WellnessCheckin = require('../models/WellnessCheckin');
const Notification = require('../models/Notification');
const EmergencyAlert = require('../models/EmergencyAlert');

async function seed() {
  await mongoose.connect(config.db.uri);
  console.log('[Seed] Connected to MongoDB');

  // Clear existing demo data
  await Promise.all([
    User.deleteMany({ email: /demo\.careconnect/ }),
    ServiceProvider.deleteMany({ isDemo: true }),
  ]);

  console.log('[Seed] Cleared old demo data');

  const hash = await bcrypt.hash('Demo@1234', 10);

  // ── Demo Users ────────────────────────────────────────────────────────────
  const parentUser = await User.create({
    name: 'Kamla Devi (Demo)',
    email: 'parent@demo.careconnect',
    password: 'Demo@1234',
    role: 'parent',
    phone: '+919876543210',
    preferredLanguage: 'hi',
    profileComplete: true,
  });

  const childUser = await User.create({
    name: 'Rohan Sharma (Demo)',
    email: 'child@demo.careconnect',
    password: 'Demo@1234',
    role: 'child',
    phone: '+919876543211',
    preferredLanguage: 'en',
    profileComplete: true,
  });

  const providerUser = await User.create({
    name: 'Ramesh Kumar (Demo Worker)',
    email: 'provider@demo.careconnect',
    password: 'Demo@1234',
    role: 'provider',
    phone: '+919876543212',
    preferredLanguage: 'en',
  });

  const adminUser = await User.create({
    name: 'CareConnect Admin (Demo)',
    email: 'admin@demo.careconnect',
    password: 'Demo@1234',
    role: 'admin',
    phone: '+919876543213',
    preferredLanguage: 'en',
  });

  console.log('[Seed] Created demo users');

  // ── Parent Profile ────────────────────────────────────────────────────────
  await ParentProfile.create({
    user: parentUser._id,
    address: {
      line1: '12, Shanti Nagar',
      line2: 'Near Community Hall',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
    },
    emergencyContacts: [
      { name: 'Rohan Sharma', phone: '+919876543211', relationship: 'Son', isPrimary: true },
      { name: 'Dr. Meera Gupta', phone: '+919800000001', relationship: 'Family Doctor', isPrimary: false },
    ],
    reminderPreferences: {
      morningCheckIn: '08:00',
      eveningCheckIn: '19:00',
      timezone: 'Asia/Kolkata',
      wantsWhatsappReminders: true,
    },
    whatsappNumber: '+919876543210',
  });

  // ── Family Link ───────────────────────────────────────────────────────────
  await FamilyLink.create({
    parent: parentUser._id,
    child: childUser._id,
    status: 'active',
    consentGivenAt: new Date(),
    permissions: {
      viewMedications: true,
      viewBookings: true,
      viewCheckins: true,
      manageBookings: true,
      receiveAlerts: true,
    },
  });

  console.log('[Seed] Created family link');

  // ── Demo Provider ─────────────────────────────────────────────────────────
  const provider = await ServiceProvider.create({
    user: providerUser._id,
    businessName: 'CleanHome Services (Demo)',
    services: ['home_cleaning', 'deep_cleaning', 'gardening', 'car_wash'],
    serviceArea: { cities: ['Jaipur'], pincodes: ['302001', '302002', '302003'] },
    availability: {
      mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false,
      workingHours: { start: '08:00', end: '18:00' },
    },
    pricing: { currency: 'INR', hourlyRate: 250, visitRate: 499, notes: 'Demo pricing only.' },
    verificationStatus: 'approved',
    idVerified: true,
    backgroundCheckPassed: true,
    rating: 4.3,
    totalReviews: 12,
    isDemo: true,
  });

  console.log('[Seed] Created demo provider');

  // ── Medicine Reminders ────────────────────────────────────────────────────
  const reminder = await MedicineReminder.create({
    parent: parentUser._id,
    createdBy: childUser._id,
    medicineName: 'Metformin 500mg (Demo)',
    instructions: 'Take after breakfast. As per authorized prescription. — Entered by family member.',
    schedule: [
      { time: '08:30', label: 'Morning — after breakfast' },
      { time: '20:30', label: 'Evening — after dinner' },
    ],
    timezone: 'Asia/Kolkata',
    recurrence: 'daily',
    isActive: true,
    followUpAfterMinutes: 30,
    notifyFamilyAfterMissed: true,
    isDemo: true,
  });

  // ── Service Bookings ──────────────────────────────────────────────────────
  const now = new Date();
  await ServiceBooking.create([
    {
      parent: parentUser._id,
      requestedBy: childUser._id,
      provider: provider._id,
      serviceCategory: 'home_cleaning',
      description: 'Regular weekly cleaning (demo)',
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      durationHours: 3,
      serviceType: 'recurring',
      recurrence: { frequency: 'weekly' },
      serviceAddress: { line1: '12, Shanti Nagar', city: 'Jaipur', pincode: '302001' },
      status: 'accepted',
      estimatedPrice: 499,
      isDemo: true,
      sourceChannel: 'dashboard',
    },
    {
      parent: parentUser._id,
      requestedBy: parentUser._id,
      serviceCategory: 'gardening',
      description: 'Garden trimming and watering (demo)',
      scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      durationHours: 2,
      serviceType: 'one_time',
      serviceAddress: { line1: '12, Shanti Nagar', city: 'Jaipur', pincode: '302001' },
      status: 'requested',
      estimatedPrice: 399,
      isDemo: true,
      sourceChannel: 'whatsapp',
    },
  ]);

  // ── Ride Request ──────────────────────────────────────────────────────────
  await RideRequest.create({
    parent: parentUser._id,
    requestedBy: childUser._id,
    pickup: { address: '12, Shanti Nagar, Jaipur' },
    destination: { address: 'SMS Hospital, Jaipur' },
    scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    specialInstructions: 'Please help with wheelchair access.',
    status: 'requested',
    isDemo: true,
    sourceChannel: 'dashboard',
  });

  // ── Wellness Check-in ─────────────────────────────────────────────────────
  await WellnessCheckin.create([
    {
      parent: parentUser._id,
      scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      sentAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      responseAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
      status: 'responded',
      mood: 'good',
      note: 'Feeling better today.',
      checkinType: 'morning',
      idempotencyKey: `seed_checkin_1_${Date.now()}`,
    },
    {
      parent: parentUser._id,
      scheduledAt: new Date(),
      status: 'scheduled',
      checkinType: 'evening',
      idempotencyKey: `seed_checkin_2_${Date.now()}`,
    },
  ]);

  // ── Notifications ─────────────────────────────────────────────────────────
  await Notification.create([
    {
      recipient: childUser._id,
      type: 'booking_accepted',
      title: 'Cleaning service accepted',
      body: 'Your home cleaning booking for tomorrow has been accepted.',
      isRead: false,
    },
    {
      recipient: childUser._id,
      type: 'checkin_missed',
      title: 'Morning check-in received',
      body: 'Your parent completed their morning wellness check-in.',
      isRead: true,
      readAt: new Date(),
    },
  ]);

  console.log('[Seed] Created demo data');
  console.log('\n[Seed] ✓ Demo credentials (DO NOT use in production):');
  console.log('  Parent:   parent@demo.careconnect  / Demo@1234');
  console.log('  Child:    child@demo.careconnect   / Demo@1234');
  console.log('  Provider: provider@demo.careconnect / Demo@1234');
  console.log('  Admin:    admin@demo.careconnect   / Demo@1234');
  console.log('\n[Seed] All data is clearly fictional for demonstration only.');

  await mongoose.disconnect();
  console.log('[Seed] Done.');
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
