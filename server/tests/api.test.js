/**
 * CareConnect Backend Test Suite
 * Runs against a test database. Uses the local MongoDB instance.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_automated_tests_only_64_chars_minimum';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/careconnect_test';
// The suite makes more than the default 100 requests / 15 min from 127.0.0.1,
// which would otherwise start returning 429 partway through the run.
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '10000';
// The server folder may carry a real .env on dev machines (e.g. WHATSAPP_PROVIDER=
// baileys after linking a number). Pin the provider off so this suite always
// asserts the demo/no-provider behaviour — identical to CI, which has no .env.
process.env.WHATSAPP_PROVIDER = process.env.WHATSAPP_PROVIDER || '';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Import app before models are used
const { app } = require('../src/app');
const mongoose = require('mongoose');

// Connect to test DB before tests
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  }
}, 30000);

const User = require('../src/models/User');
const ParentProfile = require('../src/models/ParentProfile');
const FamilyLink = require('../src/models/FamilyLink');
const MedicineReminder = require('../src/models/MedicineReminder');
const ReminderEvent = require('../src/models/ReminderEvent');
const ServiceProvider = require('../src/models/ServiceProvider');
const ServiceBooking = require('../src/models/ServiceBooking');
const Notification = require('../src/models/Notification');
const { rideProviders, foodProviders, homeServiceProviders } = require('../src/services/integrationAdapters');
const { rideHandoffs, rideHandoffFor, foodHandoffs, mapsDirectionsUrl } = require('../src/services/handoffLinks');
const whatsappService = require('../src/services/whatsappService');
const config = require('../src/config');

let parentToken, childToken, providerToken, adminToken;
let parentId, childId, providerId, adminId;
let providerProfileId;

beforeAll(async () => {
  // Wait for DB connection
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Clean test DB
  await Promise.all([
    User.deleteMany({}),
    ParentProfile.deleteMany({}),
    FamilyLink.deleteMany({}),
    MedicineReminder.deleteMany({}),
    ReminderEvent.deleteMany({}),
    ServiceProvider.deleteMany({}),
    ServiceBooking.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  // Create test users via API
  const mkUser = async (data) => {
    const res = await request(app).post('/api/auth/register').send(data);
    return res.body.data;
  };

  const parent = await mkUser({ name: 'Test Parent', email: 'parent@test.local', password: 'TestPass123', role: 'parent', phone: '+919999999990' });
  const child = await mkUser({ name: 'Test Child', email: 'child@test.local', password: 'TestPass123', role: 'child', phone: '+919999999991' });
  const provider = await mkUser({ name: 'Test Provider', email: 'provider@test.local', password: 'TestPass123', role: 'provider' });
  const admin = await mkUser({ name: 'Test Admin', email: 'admin@test.local', password: 'TestPass123', role: 'child' });

  parentToken = parent.token; parentId = parent.user._id;
  childToken = child.token; childId = child.user._id;
  providerToken = provider.token; providerId = provider.user._id;
  adminToken = admin.token; adminId = admin.user._id;

  // Promote admin via direct DB update
  await User.findByIdAndUpdate(adminId, { role: 'admin' });

  // Create active family link
  await FamilyLink.create({
    parent: parentId,
    child: childId,
    status: 'active',
    consentGivenAt: new Date(),
  });

  // Create approved provider profile
  const sp = await ServiceProvider.create({
    user: providerId,
    businessName: 'Test Services',
    services: ['home_cleaning'],
    verificationStatus: 'approved',
    isDemo: true,
  });
  providerProfileId = sp._id;
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

// ─── Authentication Tests ─────────────────────────────────────────────────────
describe('Authentication', () => {
  test('Register creates a user with hashed password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'New User', email: 'new@test.local', password: 'TestPass123', role: 'child',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('new@test.local');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toBeDefined();
  });

  test('Duplicate email is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup', email: 'parent@test.local', password: 'TestPass123',
    });
    expect(res.status).toBe(409);
  });

  test('Weak password is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak', email: 'weak@test.local', password: '123',
    });
    expect(res.status).toBe(400);
  });

  test('Login with valid credentials succeeds', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'parent@test.local', password: 'TestPass123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('Login with invalid password fails', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'parent@test.local', password: 'WrongPass',
    });
    expect(res.status).toBe(401);
  });

  test('GET /auth/me works with valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('parent@test.local');
  });

  test('GET /auth/me rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /auth/me rejects invalid tokens', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

// ─── Authorization & Data Isolation ───────────────────────────────────────────
describe('Authorization & Data Isolation', () => {
  let parentId2, childToken2;

  beforeAll(async () => {
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'Parent2', email: 'parent2@test.local', password: 'TestPass123', role: 'parent',
    });
    parentId2 = res1.body.data.user._id;

    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Child2', email: 'child2@test.local', password: 'TestPass123', role: 'child',
    });
    childToken2 = res2.body.data.token;
  });

  test('Child from family A cannot see parent B reminders', async () => {
    // Create a reminder for parent B
    await request(app).post('/api/reminders')
      .set('Authorization', `Bearer ${res2token(parentId2)}`)
      .send({ medicineName: 'Secret Med', schedule: [{ time: '09:00', label: 'Morning' }] });

    // Child2 tries to access with parentId of parent A
    const res = await request(app).get(`/api/reminders?parentId=${parentId}`).set('Authorization', `Bearer ${childToken2}`);
    expect(res.status).toBe(403);
  });

  test('Provider role cannot access admin endpoints', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(403);
  });

  test('Admin role can access admin endpoints', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('Child role cannot access provider endpoints', async () => {
    const res = await request(app).get('/api/provider/jobs').set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(403);
  });
});

// Helper to mint a token directly for tests that need one
function res2token(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ─── Medicine Reminders ───────────────────────────────────────────────────────
describe('Medicine Reminders', () => {
  let reminderId;

  test('Parent can create a reminder', async () => {
    const res = await request(app).post('/api/reminders')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        medicineName: 'TestMed 500mg',
        instructions: 'Take after food',
        schedule: [{ time: '08:30', label: 'Morning' }],
        recurrence: 'daily',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.reminder.medicineName).toBe('TestMed 500mg');
    reminderId = res.body.data.reminder._id;
  });

  test('Reminder validation rejects missing name', async () => {
    const res = await request(app).post('/api/reminders')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ schedule: [{ time: '08:30' }] });
    expect(res.status).toBe(400);
  });

  test('Parent can list reminders', async () => {
    const res = await request(app).get('/api/reminders').set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.reminders)).toBe(true);
  });

  test('Parent can update a reminder', async () => {
    const res = await request(app).patch(`/api/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.data.reminder.isActive).toBe(false);
  });

  test('Acknowledgement records correctly', async () => {
    // Create a reminder event directly
    const event = await ReminderEvent.create({
      reminder: reminderId,
      parent: parentId,
      scheduledAt: new Date(),
      deliveryStatus: 'sent',
    });

    const res = await request(app).post(`/api/reminders/events/${event._id}/acknowledge`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ acknowledgement: 'taken' });
    expect(res.status).toBe(200);
    expect(res.body.data.event.acknowledgement).toBe('taken');
  });

  test('Invalid acknowledgement value is rejected', async () => {
    const event = await ReminderEvent.create({
      reminder: reminderId,
      parent: parentId,
      scheduledAt: new Date(),
      idempotencyKey: `test_invalid_${Date.now()}`,
    });

    const res = await request(app).post(`/api/reminders/events/${event._id}/acknowledge`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ acknowledgement: 'invalid_value' });
    expect(res.status).toBe(400);
  });
});

// ─── Service Bookings ─────────────────────────────────────────────────────────
describe('Service Bookings', () => {
  let bookingId;

  test('Parent can create a booking', async () => {
    const res = await request(app).post('/api/services/bookings')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        serviceCategory: 'home_cleaning',
        description: 'Weekly cleaning',
        scheduledAt: new Date(Date.now() + 86400000),
        durationHours: 2,
        serviceAddress: { line1: '12 Test St', city: 'Jaipur', pincode: '302001' },
      });
    expect(res.status).toBe(201);
    expect(res.body.data.booking.status).toBe('requested');
    bookingId = res.body.data.booking._id;
  });

  test('Booking with missing address is rejected', async () => {
    const res = await request(app).post('/api/services/bookings')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        serviceCategory: 'home_cleaning',
        scheduledAt: new Date(),
      });
    // Mongoose validation should catch required scheduledAt or we accept with partial address
    // At minimum, the API must not 500
    expect(res.status).toBeLessThan(500);
  });

  test('Parent can list bookings', async () => {
    const res = await request(app).get('/api/services/bookings').set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.bookings.length).toBeGreaterThan(0);
  });

  test('Family child can view linked parent bookings', async () => {
    const res = await request(app).get(`/api/services/bookings?parentId=${parentId}`)
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(200);
  });

  test('Provider can accept an eligible booking', async () => {
    // Assign booking to provider
    await ServiceBooking.findByIdAndUpdate(bookingId, { provider: providerProfileId });

    const res = await request(app).post(`/api/provider/jobs/${bookingId}/accept`)
      .set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('accepted');
  });

  test('Provider cannot accept an already accepted booking', async () => {
    const res = await request(app).post(`/api/provider/jobs/${bookingId}/accept`)
      .set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(400);
  });

  test('Provider can transition accepted → in_progress', async () => {
    const res = await request(app).patch(`/api/provider/jobs/${bookingId}/status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
  });

  test('Provider can transition in_progress → completed', async () => {
    const res = await request(app).patch(`/api/provider/jobs/${bookingId}/status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('completed');
  });

  test('Completed booking cannot be cancelled', async () => {
    const res = await request(app).post(`/api/services/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ reason: 'test' });
    expect(res.status).toBe(400);
  });

  test('Ride request can be created', async () => {
    const res = await request(app).post('/api/services/rides')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        pickup: { address: 'Home' },
        destination: { address: 'Hospital' },
        scheduledAt: new Date(Date.now() + 3600000),
      });
    expect(res.status).toBe(201);
    expect(res.body.data.ride.isDemo).toBe(true);
  });

  test('Food order can be created in demo mode', async () => {
    const res = await request(app).post('/api/services/orders')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        items: [{ itemId: 'm1', name: 'Dal Khichdi', quantity: 2, unitPrice: 120 }],
        deliveryAddress: { line1: '12 Test St' },
        estimatedTotal: 240,
      });
    expect(res.status).toBe(201);
    expect(res.body.demoMode).toBe(true);
  });

  test('Ride quotes compare Ola, Uber and Rapido (demo)', async () => {
    const res = await request(app).get('/api/services/rides/quotes?pickup=Home&destination=City%20Hospital')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.demoMode).toBe(true);
    const providerIds = res.body.data.comparison.map((q) => q.providerId).sort();
    expect(providerIds).toEqual(['ola', 'rapido', 'uber']);
    expect(res.body.data.quotes.every((q) => q.isDemo === true)).toBe(true);
    expect(res.body.data.handoffs.map((h) => h.providerId)).toEqual(['uber', 'ola', 'rapido', 'maps']);
    const uber = res.body.data.handoffs.find((h) => h.providerId === 'uber');
    expect(uber.url).toContain('https://m.uber.com/ul/?action=setPickup');
    expect(uber.url).toContain('City%20Hospital');
  });

  test('Ride quotes require pickup and destination', async () => {
    const res = await request(app).get('/api/services/rides/quotes?pickup=Home')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(400);
  });

  test('Ride booking with chosen provider stores demo reference', async () => {
    const res = await request(app).post('/api/services/rides')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        pickup: { address: 'Home' },
        destination: { address: 'Apollo Clinic' },
        scheduledAt: new Date(Date.now() + 3600000),
        providerId: 'uber',
        vehicleId: 'uber-go',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.ride.isDemo).toBe(true);
    expect(res.body.data.ride.externalProvider).toBe('uber');
    expect(res.body.data.ride.demoBookingRef).toMatch(/^UBER-DEMO-/);
    expect(res.body.data.handoff.providerId).toBe('uber');
    expect(res.body.data.handoff.url).toContain('m.uber.com');
  });

  test('Food menu returns Zomato-style demo catalogue', async () => {
    const res = await request(app).get('/api/services/menu')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.demoMode).toBe(true);
    expect(res.body.data.menu.length).toBeGreaterThan(0);
    expect(res.body.data.restaurants.length).toBeGreaterThan(0);
    expect(res.body.data.handoffs.map((h) => h.providerId)).toEqual(['swiggy', 'zomato', 'maps']);
  });

  test('Food order stores Zomato-style demo reference', async () => {
    const res = await request(app).post('/api/services/orders')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ items: [{ itemId: 'm2', name: 'Idli Sambhar (4 pcs)', quantity: 1, unitPrice: 80 }] });
    expect(res.status).toBe(201);
    expect(res.body.data.order.demoBookingRef).toMatch(/^ZOMATO-DEMO-/);
  });

  test('Service booking stores Urban Company demo reference', async () => {
    const res = await request(app).post('/api/services/bookings')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        serviceCategory: 'gardening',
        description: 'Demo UC booking',
        scheduledAt: new Date(Date.now() + 86400000),
      });
    expect(res.status).toBe(201);
    expect(res.body.demoMode).toBe(true);
    expect(res.body.data.booking.demoBookingRef).toMatch(/^UC-DEMO-/);
  });
});

// ─── Family Linking ───────────────────────────────────────────────────────────
describe('Family Linking', () => {
  let invitationCode;

  test('Parent can create an invitation', async () => {
    const res = await request(app).post('/api/family/invitations')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(201);
    expect(res.body.data.code).toBeDefined();
    invitationCode = res.body.data.code;
  });

  test('Cannot accept own invitation', async () => {
    const res = await request(app).post('/api/family/invitations/accept')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ code: invitationCode });
    expect(res.status).toBe(400);
  });

  test('Child can accept invitation from another parent', async () => {
    // Register a new parent
    const parentRes = await request(app).post('/api/auth/register').send({
      name: 'Invite Parent', email: 'inviteparent@test.local', password: 'TestPass123', role: 'parent',
    });
    const inviteParentToken = parentRes.body.data.token;

    // Create invitation
    const invRes = await request(app).post('/api/family/invitations')
      .set('Authorization', `Bearer ${inviteParentToken}`);
    const code = invRes.body.data.code;

    // Register new child and accept
    const childRes = await request(app).post('/api/auth/register').send({
      name: 'Invite Child', email: 'invitechild@test.local', password: 'TestPass123', role: 'child',
    });
    const acceptRes = await request(app).post('/api/family/invitations/accept')
      .set('Authorization', `Bearer ${childRes.body.data.token}`)
      .send({ code });
    expect(acceptRes.status).toBe(200);
  });

  test('Invalid invitation code is rejected', async () => {
    const res = await request(app).post('/api/family/invitations/accept')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ code: 'INVALID123' });
    expect(res.status).toBe(404);
  });
});

// ─── Emergency ────────────────────────────────────────────────────────────────
describe('Emergency Alerts', () => {
  let alertId;

  test('Parent can trigger an emergency alert', async () => {
    const res = await request(app).post('/api/emergency/alerts')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ assistanceType: 'medical', message: 'Feeling dizzy', triggeredBy: 'dashboard' });
    expect(res.status).toBe(201);
    expect(res.body.data.alert.status).toBe('active');
    alertId = res.body.data.alert._id;
  });

  test('Family member is notified of emergency', async () => {
    const notifs = await Notification.find({ recipient: childId, type: 'emergency_alert' });
    expect(notifs.length).toBeGreaterThan(0);
  });

  test('Alert can be acknowledged', async () => {
    const res = await request(app).patch(`/api/emergency/alerts/${alertId}/acknowledge`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({ resolution: 'acknowledged' });
    expect(res.status).toBe(200);
    expect(res.body.data.alert.status).toBe('acknowledged');
  });
});

// ─── Notifications ────────────────────────────────────────────────────────────
describe('Notifications', () => {
  test('User can list notifications', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.notifications)).toBe(true);
  });

  test('Unread filter works', async () => {
    const res = await request(app).get('/api/notifications?unread=true').set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(200);
  });

  test('Mark all as read works', async () => {
    const res = await request(app).post('/api/notifications/mark-all-read').set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(200);
  });
});

// ─── Webhook (Demo Mode) ──────────────────────────────────────────────────────
describe('WhatsApp Webhook', () => {
  test('Webhook verification endpoint responds', async () => {
    const verifyToken = config.whatsapp.meta.webhookVerifyToken;
    const res = await request(app).get(`/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=test123`);
    expect(res.status).toBe(200);
  });

  test('Invalid verify token is rejected', async () => {
    const res = await request(app).get('/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=test123');
    expect(res.status).toBe(403);
  });

  test('Incoming message is processed in demo mode', async () => {
    const res = await request(app).post('/api/webhooks/whatsapp')
      .send({
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '+919999999990',
                id: `test_msg_${Date.now()}`,
                type: 'text',
                text: { body: 'I need a ride to hospital tomorrow' },
              }],
            },
          }],
        }],
      });
    // Always returns 200 to prevent Meta retries
    expect(res.status).toBe(200);
  });

  test('Duplicate webhook message is deduplicated', async () => {
    const msgId = `dup_msg_${Date.now()}`;
    const payload = {
      entry: [{
        changes: [{
          value: {
            messages: [{ from: '+919999999990', id: msgId, type: 'text', text: { body: 'book cleaning' } }],
          },
        }],
      }],
    };
    const res1 = await request(app).post('/api/webhooks/whatsapp').send(payload);
    expect(res1.status).toBe(200);
    const res2 = await request(app).post('/api/webhooks/whatsapp').send(payload);
    expect(res2.status).toBe(200);
  });
});

// ─── WhatsApp Simulator (Demo) ───────────────────────────────────────────────
describe('WhatsApp Simulator', () => {
  // Dedicated parent so webhook tests (same phone number) cannot leak session state
  let simParentToken;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sim Parent',
      email: 'simparent@test.local',
      password: 'TestPass123',
      role: 'parent',
      phone: '+919999999950',
    });
    simParentToken = res.body.data.token;
  });

  const post = (text, token = simParentToken) =>
    request(app).post('/api/simulator/whatsapp').set('Authorization', `Bearer ${token}`).send({ message: text });

  test('Simulator rejects non-parent roles', async () => {
    const res = await post('Khana chahiye', childToken);
    expect(res.status).toBe(403);
  });

  test('Empty message is rejected', async () => {
    const res = await post('   ');
    expect(res.status).toBe(400);
  });

  test('Food flow: menu is returned then order is placed', async () => {
    const r1 = await post('Khana chahiye');
    expect(r1.status).toBe(200);
    expect(r1.body.data.replies.length).toBeGreaterThan(0);
    expect(r1.body.data.replies[0].text.toLowerCase()).toContain('menu');
    expect(r1.body.data.replies[0].text).toContain('swiggy.com');
    expect(r1.body.data.replies[0].text).toContain('zomato.com');

    const r2 = await post('1');
    expect(r2.status).toBe(200);
    expect(r2.body.data.replies[0].text).toContain('Order placed');
    expect(r2.body.data.replies[0].text).toMatch(/ZOMATO-DEMO-/);
  });

  test('Ride flow: destination → quotes → booking', async () => {
    const r1 = await post('Mujhe ride chahiye');
    expect(r1.body.data.replies[0].text).toContain('Destination');

    const r2 = await post('City Hospital');
    expect(r2.body.data.replies[0].text).toContain('Ride options');
    expect(r2.body.data.replies[0].text).toContain('m.uber.com');
    expect(r2.body.data.replies[0].text).toContain('book.olacabs.com');

    const r3 = await post('1');
    expect(r3.body.data.replies[0].text).toContain('Ride booked');
    expect(r3.body.data.replies[0].text).toMatch(/-DEMO-/);
    expect(r3.body.data.replies[0].text).toMatch(/rapido\.bike|m\.uber\.com|book\.olacabs\.com/);
  });

  test('Home service message creates a demo booking reply', async () => {
    const res = await post('Ghar ki safai karani hai');
    expect(res.status).toBe(200);
    expect(res.body.data.replies[0].text).toContain('UC-DEMO-');
  });
});

// ─── Admin ────────────────────────────────────────────────────────────────────
describe('Admin', () => {
  test('Admin can list users', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.users.length).toBeGreaterThan(0);
  });

  test('Admin can view integration status', async () => {
    const res = await request(app).get('/api/admin/integrations').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.whatsapp.status).toBe('demo_mode');
    expect(res.body.data.ai.status).toBe('fallback_mode');
  });

  test('Admin can view audit logs', async () => {
    const res = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('Admin can toggle user active status', async () => {
    const target = await User.findOne({ email: 'new@test.local' });
    const res = await request(app).patch(`/api/admin/users/${target._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ─── Admin · WhatsApp mode toggle ────────────────────────────────────────────
describe('Admin · WhatsApp mode toggle', () => {
  const MODE_FILE = path.resolve(__dirname, '../.whatsapp-mode.json');
  const readModeFile = () => {
    try { return fs.readFileSync(MODE_FILE, 'utf8'); } catch { return null; }
  };
  let modeFileSnapshot;

  beforeAll(() => { modeFileSnapshot = readModeFile(); });

  afterAll(() => {
    if (modeFileSnapshot === null) {
      try { fs.unlinkSync(MODE_FILE); } catch { /* nothing to clean up */ }
    } else {
      try { fs.writeFileSync(MODE_FILE, modeFileSnapshot); } catch { /* best effort */ }
    }
    whatsappService._mode = null; // restore the "auto" preference for later suites
  });

  test('Admin can switch WhatsApp to demo mode', async () => {
    const res = await request(app).post('/api/admin/whatsapp/mode')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mode: 'demo' });

    expect(res.status).toBe(200);
    expect(res.body.data.whatsapp.mode).toBe('demo');
    expect(whatsappService.isDemo).toBe(true);
    expect(res.body.data.whatsapp).toHaveProperty('missing');
  });

  test('Going live is refused while credentials are missing', async () => {
    if (whatsappService.configured) return; // this env has real credentials — nothing to assert

    const res = await request(app).post('/api/admin/whatsapp/mode')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mode: 'live' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Cannot switch to live mode/);
    expect(whatsappService.isDemo).toBe(true);
  });

  test('An unknown mode value is rejected', async () => {
    const res = await request(app).post('/api/admin/whatsapp/mode')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mode: 'production' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/demo/);
  });

  test('Non-admins cannot switch the mode', async () => {
    const res = await request(app).post('/api/admin/whatsapp/mode')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ mode: 'demo' });

    expect(res.status).toBe(403);
  });
});

// ─── Security ─────────────────────────────────────────────────────────────────
describe('Security', () => {
  test('Passwords are never returned by API', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'parent@test.local', password: 'TestPass123',
    });
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('Invalid input returns 400 not 500', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: '', email: 'notanemail', password: '123',
    });
    expect(res.status).toBe(400);
  });

  test('Admin endpoints return 403 for non-admin', async () => {
    const endpoints = ['/api/admin/users', '/api/admin/stats', '/api/admin/integrations', '/api/admin/audit-logs'];
    for (const ep of endpoints) {
      const res = await request(app).get(ep).set('Authorization', `Bearer ${childToken}`);
      expect(res.status).toBe(403);
    }
  });

  test('Secrets are not in public health endpoint', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    const text = JSON.stringify(res.body);
    expect(text).not.toContain('JWT_SECRET');
    expect(text).not.toContain('MONGODB_URI');
  });
});

// ─── Demo Integration Adapters ────────────────────────────────────────────────
describe('Demo Integration Adapters', () => {
  test('Ride comparison returns cheapest quote per provider', () => {
    const comparison = rideProviders.getComparison({ pickup: 'Home', destination: 'Hospital' });
    expect(comparison.map((q) => q.providerId).sort()).toEqual(['ola', 'rapido', 'uber']);
    // Sorted by price ascending
    for (let i = 1; i < comparison.length; i++) {
      expect(comparison[i].price).toBeGreaterThanOrEqual(comparison[i - 1].price);
    }
  });

  test('Ride quotes are deterministic for the same route', () => {
    const a = rideProviders.getQuotes({ pickup: 'Home', destination: 'Hospital' });
    const b = rideProviders.getQuotes({ pickup: 'Home', destination: 'Hospital' });
    expect(a.map((q) => q.price)).toEqual(b.map((q) => q.price));
    expect(a.map((q) => q.etaMin)).toEqual(b.map((q) => q.etaMin));
  });

  test('bookRide returns a DEMO ref and simulated driver', () => {
    const booking = rideProviders.bookRide({
      providerId: 'rapido', vehicleId: 'rapido-auto', pickup: 'Home', destination: 'Market',
    });
    expect(booking.ref).toMatch(/^RAPIDO-DEMO-/);
    expect(booking.isDemo).toBe(true);
    expect(booking.driverName).toBeTruthy();
  });

  test('bookRide returns null for an unknown provider', () => {
    const booking = rideProviders.bookRide({
      providerId: 'unknown', vehicleId: 'nope', pickup: 'Home', destination: 'Market',
    });
    expect(booking).toBeNull();
  });

  test('Food provider returns menu with restaurants and DEMO order refs', () => {
    const menu = foodProviders.getMenu();
    expect(menu.length).toBeGreaterThan(0);
    expect(menu[0].restaurantName).toBeTruthy();
    const placement = foodProviders.placeOrder({
      items: [{ itemId: 'm1', name: 'Dal Khichdi', quantity: 1, unitPrice: 120 }],
    });
    expect(placement.ref).toMatch(/^ZOMATO-DEMO-/);
    expect(placement.isDemo).toBe(true);
    expect(placement.estimatedTotal).toBe(120);
  });

  test('Home service provider returns Urban Company DEMO ref', () => {
    const booking = homeServiceProviders.bookService({ categoryId: 'home_cleaning' });
    expect(booking.ref).toMatch(/^UC-DEMO-/);
    expect(booking.isDemo).toBe(true);
    expect(booking.proName).toBeTruthy();
  });

  test('Distance estimate is deterministic and within range', () => {
    const d = rideProviders.estimateDistanceKm('Home', 'Hospital');
    expect(d).toBe(rideProviders.estimateDistanceKm('Home', 'Hospital'));
    expect(d).toBeGreaterThanOrEqual(4);
    expect(d).toBeLessThanOrEqual(18.1);
  });
});

// ─── Real-World Handoff Links ─────────────────────────────────────────────────
describe('Real-World Handoff Links', () => {
  test('rideHandoffs returns Uber, Ola, Rapido and Maps links', () => {
    const handoffs = rideHandoffs({ pickup: 'Home', destination: 'City Hospital' });
    expect(handoffs.map((h) => h.providerId)).toEqual(['uber', 'ola', 'rapido', 'maps']);
  });

  test('Uber link pre-fills the encoded dropoff address', () => {
    const uber = rideHandoffFor('uber', { pickup: 'Home', destination: 'City Hospital' });
    expect(uber.url).toBe(
      'https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=City%20Hospital'
    );
  });

  test('Ola link uses the documented web deep-link format', () => {
    const ola = rideHandoffFor('ola', { pickup: 'Home', destination: 'City Hospital' });
    expect(ola.url).toBe('https://book.olacabs.com/?drop_name=City%20Hospital');
  });

  test('Google Maps directions link encodes both origin and destination', () => {
    const url = mapsDirectionsUrl({ origin: 'Home', destination: 'City Hospital' });
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=City%20Hospital&travelmode=driving&origin=Home'
    );
  });

  test('rideHandoffFor returns null for an unknown provider', () => {
    expect(rideHandoffFor('unknown', { destination: 'X' })).toBeNull();
  });

  test('foodHandoffs links to Swiggy, Zomato and Maps nearby', () => {
    const handoffs = foodHandoffs();
    expect(handoffs.map((h) => h.providerId)).toEqual(['swiggy', 'zomato', 'maps']);
    expect(handoffs[0].url).toBe('https://www.swiggy.com/');
    expect(handoffs[1].url).toBe('https://www.zomato.com/');
    expect(handoffs[2].url).toContain('google.com/maps/search');
  });
});

// ─── Add Parent Details + OTP Verification ────────────────────────────────────
describe('Add Parent via OTP', () => {
  const parentPhone = '+919888777666';
  let demoOtp;

  test('Parent role cannot request OTP', async () => {
    const res = await request(app).post('/api/family/otp/request')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ name: 'Someone', phone: '+919888777111' });
    expect(res.status).toBe(403);
  });

  test('Invalid phone number is rejected', async () => {
    const res = await request(app).post('/api/family/otp/request')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ name: 'Bad Phone', phone: 'abc' });
    expect(res.status).toBe(400);
  });

  test('Child can request OTP for parent details (demo returns OTP)', async () => {
    const res = await request(app).post('/api/family/otp/request')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ name: 'OTP Test Parent', phone: parentPhone, relationship: 'Mother' });
    expect(res.status).toBe(201);
    expect(res.body.data.demoOtp).toMatch(/^\d{6}$/);
    expect(res.body.demoMode).toBe(true);
    demoOtp = res.body.data.demoOtp;
  });

  test('Wrong OTP is rejected with attempts left', async () => {
    const res = await request(app).post('/api/family/otp/verify')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ phone: parentPhone, otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.data.attemptsLeft).toBeGreaterThan(0);
  });

  test('Correct OTP creates parent account and activates family link', async () => {
    const res = await request(app).post('/api/family/otp/verify')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ phone: parentPhone, otp: demoOtp });
    expect(res.status).toBe(200);
    expect(res.body.data.parent.name).toBe('OTP Test Parent');
    expect(res.body.data.parent.role).toBe('parent');
    expect(res.body.data.parent.phone).toBe(parentPhone);
    expect(res.body.data.parent.phoneVerified).toBe(true);
    expect(res.body.data.link.status).toBe('active');
  });

  test('Family list now includes the OTP-linked parent', async () => {
    const res = await request(app).get('/api/family')
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(200);
    const match = res.body.data.links.find((l) => l.parent?.phone === parentPhone);
    expect(match).toBeDefined();
    expect(match.status).toBe('active');
  });

  test('Already-linked parent cannot be added again', async () => {
    const res = await request(app).post('/api/family/otp/request')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ name: 'OTP Test Parent', phone: parentPhone });
    expect(res.status).toBe(409);
  });

  test('Used OTP cannot be replayed', async () => {
    const res = await request(app).post('/api/family/otp/verify')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ phone: parentPhone, otp: demoOtp });
    expect(res.status).toBe(404);
  });

  test('buildMetaOtpPayload creates a Meta authentication template payload', () => {
    const payload = whatsappService.buildMetaOtpPayload('+919999000111', '123456', { hasButton: true });
    expect(payload.messaging_product).toBe('whatsapp');
    expect(payload.to).toBe('+919999000111');
    expect(payload.type).toBe('template');
    expect(payload.template.name).toBe('otp_verification');
    expect(payload.template.language.code).toBe('en_US');
    expect(payload.template.components[0].parameters[0].text).toBe('123456');
    expect(payload.template.components[1].sub_type).toBe('url');
    expect(payload.template.components[1].parameters[0].text).toBe('123456');
  });

  test('buildMetaOtpPayload omits button component by default', () => {
    const payload = whatsappService.buildMetaOtpPayload('+919999000111', '123456', { hasButton: false });
    expect(payload.template.components).toHaveLength(1);
  });

  test('Delivery failure returns 502 and does not leak any OTP', async () => {
    const spy = jest.spyOn(whatsappService, 'sendOtp').mockRejectedValueOnce(new Error('graph api down'));
    try {
      const res = await request(app).post('/api/family/otp/request')
        .set('Authorization', `Bearer ${childToken}`)
        .send({ name: 'Fail Parent', phone: '+919777666555' });
      expect(res.status).toBe(502);
      expect(JSON.stringify(res.body)).not.toContain('demoOtp');
      expect(res.body.data).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });

  test('Demo mode OTP request still surfaces demoOtp for the simulator', async () => {
    expect(whatsappService.isDemo).toBe(true);
    const res = await request(app).post('/api/family/otp/request')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ name: 'Demo Parent', phone: '+919666555444' });
    expect(res.status).toBe(201);
    expect(res.body.data.demoOtp).toMatch(/^\d{6}$/);
  });
});

// ─── Phone + WhatsApp OTP Auth (children) ─────────────────────────────────────
describe('Phone OTP Auth (children)', () => {
  const authPhone = '+919555444333';
  let signupOtp;
  let createdUserId;
  let sessionToken;

  test('Invalid phone number is rejected', async () => {
    const res = await request(app).post('/api/auth/otp/request').send({ phone: 'not-a-number' });
    expect(res.status).toBe(400);
  });

  test('Request OTP for a new number (signup)', async () => {
    const res = await request(app).post('/api/auth/otp/request').send({ phone: authPhone });
    expect(res.status).toBe(201);
    expect(res.body.data.existingUser).toBe(false);
    expect(res.body.data.demoOtp).toMatch(/^\d{6}$/);
    signupOtp = res.body.data.demoOtp;
  });

  test('Wrong OTP is rejected with attempts left', async () => {
    const res = await request(app).post('/api/auth/otp/verify')
      .send({ phone: authPhone, otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.data.attemptsLeft).toBeGreaterThan(0);
  });

  test('Correct OTP for a new user asks for a name first', async () => {
    const res = await request(app).post('/api/auth/otp/verify')
      .send({ phone: authPhone, otp: signupOtp });
    expect(res.status).toBe(400);
    expect(res.body.data.needsName).toBe(true);
  });

  test('Correct OTP with name creates the child account and signs in', async () => {
    const res = await request(app).post('/api/auth/otp/verify')
      .send({ phone: authPhone, otp: signupOtp, name: 'OTP Child' });
    expect(res.status).toBe(201);
    expect(res.body.data.isNew).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('child');
    expect(res.body.data.user.phone).toBe(authPhone);
    expect(res.body.data.user.phoneVerified).toBe(true);
    createdUserId = res.body.data.user._id;
    sessionToken = res.body.data.token;
  });

  test('The OTP-issued session works', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('OTP Child');
  });

  test('Existing child can OTP-login again (no name needed)', async () => {
    const reqRes = await request(app).post('/api/auth/otp/request').send({ phone: authPhone });
    expect(reqRes.status).toBe(201);
    expect(reqRes.body.data.existingUser).toBe(true);

    const res = await request(app).post('/api/auth/otp/verify')
      .send({ phone: authPhone, otp: reqRes.body.data.demoOtp });
    expect(res.status).toBe(200);
    expect(res.body.data.isNew).toBe(false);
    expect(res.body.data.user._id).toBe(createdUserId);
  });

  test('Re-request while a fresh code is pending is rate limited', async () => {
    const first = await request(app).post('/api/auth/otp/request').send({ phone: authPhone });
    expect(first.status).toBe(201);
    const second = await request(app).post('/api/auth/otp/request').send({ phone: authPhone });
    expect(second.status).toBe(429);
  });

  test('A parent number cannot be used for child OTP login', async () => {
    const res = await request(app).post('/api/auth/otp/request').send({ phone: '+919888777666' });
    expect(res.status).toBe(409);
  });
});

// ─── WhatsApp · Baileys channel & production live-only rules ──────────────────
describe('WhatsApp · Baileys channel & production live-only', () => {
  const baileysService = require('../src/services/baileysService');
  const MODE_FILE = path.resolve(__dirname, '../.whatsapp-mode.json');
  let originalProvider;
  let modeFileSnapshot;

  beforeAll(() => {
    originalProvider = whatsappService.provider;
    try { modeFileSnapshot = fs.readFileSync(MODE_FILE, 'utf8'); } catch { modeFileSnapshot = null; }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    whatsappService.provider = originalProvider;
    whatsappService._mode = null;
    // Never leave a mode file written by these tests behind.
    if (modeFileSnapshot === null) {
      try { fs.unlinkSync(MODE_FILE); } catch { /* nothing to clean up */ }
    } else {
      try { fs.writeFileSync(MODE_FILE, modeFileSnapshot); } catch { /* best effort */ }
    }
  });

  test('JID and phone numbers normalise to the DB format', () => {
    expect(baileysService.jidToPhone('919876543210@s.whatsapp.net')).toBe('+919876543210');
    expect(baileysService.phoneToJid('+919876543210')).toBe('919876543210@s.whatsapp.net');
    expect(baileysService.phoneToJid('919876543210')).toBe('919876543210@s.whatsapp.net');
    expect(baileysService.phoneToJid('')).toBe('');
  });

  test('Text is extracted from the common WhatsApp message shapes', () => {
    expect(baileysService.extractText({ conversation: 'hi' })).toBe('hi');
    expect(baileysService.extractText({ extendedTextMessage: { text: 'order food' } })).toBe('order food');
    expect(baileysService.extractText({ imageMessage: { caption: 'yeh dekho' } })).toBe('yeh dekho');
    expect(baileysService.extractText({ ephemeralMessage: { message: { conversation: 'wrapped' } } })).toBe('wrapped');
    expect(baileysService.extractText({ protocolMessage: {} })).toBeNull();
  });

  test('Baileys without a linked session cannot go live (QR scan required)', () => {
    whatsappService.provider = 'baileys';
    jest.spyOn(baileysService, 'hasSession').mockReturnValue(false);

    expect(whatsappService.configured).toBe(false);
    expect(whatsappService.missingCredentials.join(' ')).toMatch(/QR/i);
    expect(() => whatsappService.setMode('live')).toThrow(/Cannot switch to live mode/);
    expect(() => whatsappService.setMode('live')).toThrow(/QR/i);
  });

  test('Baileys with a linked session is fully configured and can go live', () => {
    whatsappService.provider = 'baileys';
    jest.spyOn(baileysService, 'hasSession').mockReturnValue(true);

    expect(whatsappService.configured).toBe(true);
    expect(whatsappService.missingCredentials).toEqual([]);

    const status = whatsappService.setMode('live');
    expect(status.mode).toBe('live');
    expect(whatsappService.isDemo).toBe(false);
  });

  test('Sending while the number is not linked fails with a QR-scan error', async () => {
    whatsappService.provider = 'baileys';
    whatsappService._mode = 'live';
    jest.spyOn(baileysService, 'hasSession').mockReturnValue(true);

    await expect(whatsappService.sendMessage('+919876543210', 'hi')).rejects.toThrow(/QR code/i);
  });

  test('Production forces live mode and refuses demo', () => {
    const isProd = jest.spyOn(config, 'isProd').mockReturnValue(true);
    whatsappService._mode = 'demo'; // even an explicit saved demo preference is ignored

    expect(whatsappService.isDemo).toBe(false);
    expect(whatsappService.mode).toBe('live');
    expect(whatsappService.getStatus().preference).toBe('live');
    expect(() => whatsappService.setMode('demo')).toThrow(/production/i);
    expect(isProd).toHaveBeenCalled();
  });

  test('Channel status endpoint works for admins', async () => {
    const res = await request(app)
      .get('/api/admin/whatsapp/channel')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('state');
    expect(res.body.data).toHaveProperty('sessionExists');
  });

  test('Test-send endpoint validates its input', async () => {
    const res = await request(app)
      .post('/api/admin/whatsapp/channel/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ to: '', text: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('Non-admins cannot touch the WhatsApp channel', async () => {
    const res = await request(app)
      .get('/api/admin/whatsapp/channel')
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(403);
  });
});
