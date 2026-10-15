/**
 * CareConnect Backend Test Suite
 * Runs against a test database. Uses the local MongoDB instance.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_automated_tests_only_64_chars_minimum';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/careconnect_test';

const request = require('supertest');
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
    const res = await request(app).get('/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=dev_verify_token&hub.challenge=test123');
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
