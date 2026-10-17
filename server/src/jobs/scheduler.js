/**
 * Background scheduler for reminders, wellness check-ins and notification delivery.
 * Uses node-cron. All jobs are idempotent via idempotencyKey — retries never
 * create duplicate reminder events or notifications.
 */
const cron = require('node-cron');
const MedicineReminder = require('../models/MedicineReminder');
const ReminderEvent = require('../models/ReminderEvent');
const WellnessCheckin = require('../models/WellnessCheckin');
const FamilyLink = require('../models/FamilyLink');
const Notification = require('../models/Notification');
const User = require('../models/User');
const ParentProfile = require('../models/ParentProfile');
const whatsappService = require('../services/whatsappService');
const config = require('../config');

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function istNow() {
  // IST = UTC+5:30
  const now = new Date();
  return new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
}

function fmt(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Due reminders ─────────────────────────────────────────────────────────────
async function processDueReminders() {
  const now = istNow();
  const nowKey = fmt(now);
  const dayKey = DAY_KEYS[now.getDay()];

  const reminders = await MedicineReminder.find({ isActive: true });

  for (const reminder of reminders) {
    if (reminder.startDate && now < reminder.startDate) continue;
    if (reminder.endDate && now > reminder.endDate) continue;
    if (reminder.recurrence !== 'daily' && !(reminder.activeDays || []).includes(dayKey)) continue;

    for (const slot of reminder.schedule || []) {
      const idempotencyKey = `${reminder._id}_${fmt(new Date(`${nowKey.slice(0, 10)}T${slot.time}:00`))}`;

      try {
        const event = await ReminderEvent.create({
          reminder: reminder._id,
          parent: reminder.parent,
          scheduledAt: new Date(`${nowKey.slice(0, 10)}T${slot.time}:00`),
          idempotencyKey,
        });

        // Deliver
        event.sentAt = new Date();
        event.deliveryStatus = 'sent';
        await event.save();

        // In-app notification to the parent
        await Notification.create({
          recipient: reminder.parent,
          type: 'reminder_due',
          title: `Medicine reminder: ${reminder.medicineName}`,
          body: `${slot.label || 'Scheduled dose'} at ${slot.time} IST.${reminder.instructions ? ' ' + reminder.instructions : ''} Reply TAKEN / LATER / HELP.`,
          data: { eventId: event._id, reminderId: reminder._id },
        });

        // WhatsApp (demo mode just logs)
        if (reminder.parent && reminder.parent.toString()) {
          const parent = await User.findById(reminder.parent);
          if (parent?.phone) {
            const sent = await whatsappService.sendMessage(
              parent.phone,
              `Reminder: ${reminder.medicineName} — ${slot.label || slot.time}. Reply TAKEN, LATER or HELP.`
            ).catch((e) => ({ success: false, error: e.message }));
            if (!sent.success) {
              event.deliveryStatus = 'failed';
              await event.save();
            }
          }
        }
      } catch (err) {
        if (err.code === 11000) continue; // duplicate — safe skip
        console.error('[Job] Reminder error:', err.message);
      }
    }
  }
}

// ── Missed acknowledgement follow-ups ────────────────────────────────────────
async function processMissedFollowUps() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 60 * 1000); // 30+ min overdue

  const missed = await ReminderEvent.find({
    acknowledgement: null,
    scheduledAt: { $lt: cutoff },
    sentAt: { $ne: null },
  }).populate('reminder');

  for (const event of missed) {
    const reminder = event.reminder;
    if (!reminder || !reminder.isActive) continue;

    const maxFollowUps = reminder.maxFollowUps ?? 2;
    if (event.followUpCount >= maxFollowUps) {
      // Escalate to family once
      if (!event.familyAlertSent && reminder.notifyFamilyAfterMissed) {
        const links = await FamilyLink.find({ parent: event.parent, status: 'active' }).select('child');
        await Notification.insertMany(
          links.map((l) => ({
            recipient: l.child,
            type: 'reminder_missed',
            title: 'Medicine reminder not acknowledged',
            body: `${reminder.medicineName} reminder from ${new Date(event.scheduledAt).toLocaleString('en-IN')} has not been acknowledged. This is not necessarily an emergency — please check in with your parent.`,
            data: { eventId: event._id },
          }))
        );
        event.familyAlertSent = true;
        event.familyAlertSentAt = new Date();
        await event.save();
      }
      continue;
    }

    event.followUpCount += 1;
    await event.save();

    await Notification.create({
      recipient: event.parent,
      type: 'reminder_due',
      title: `Follow-up: ${reminder.medicineName}`,
      body: `Have you taken your medicine? Reply TAKEN, LATER or HELP.`,
      data: { eventId: event._id },
    });
  }
}

// ── Wellness check-in scheduling ──────────────────────────────────────────────
async function scheduleCheckins() {
  const now = istNow();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);

  const profiles = await ParentProfile.find();

  for (const p of profiles) {
    const prefs = p.reminderPreferences || {};
    const type = prefs.morningCheckIn === hhmm ? 'morning' : prefs.eveningCheckIn === hhmm ? 'evening' : null;
    if (!type) continue;

    try {
      const checkin = await WellnessCheckin.create({
        parent: p.user,
        scheduledAt: now,
        status: 'sent',
        sentAt: new Date(),
        checkinType: type,
        idempotencyKey: `checkin_sched_${p.user}_${dayStart.toISOString().slice(0, 10)}_${type}`,
      });

      await Notification.create({
        recipient: p.user,
        type: 'checkin_missed',
        title: `${type === 'morning' ? 'Morning' : 'Evening'} wellness check-in`,
        body: 'How are you feeling today? Open your dashboard or reply on WhatsApp.',
        data: { checkinId: checkin._id },
      });

      if (p.whatsappNumber && whatsappService.isDemo === false) {
        await whatsappService.sendMessage(p.whatsappNumber, 'Aaj kaisa mahsoos ho raha hai? Reply: great / good / okay / not well / help');
      }
    } catch (err) {
      if (err.code === 11000) continue;
      console.error('[Job] Check-in error:', err.message);
    }
  }
}

// ── Missed check-in escalation ────────────────────────────────────────────────
async function processMissedCheckins() {
  const now = new Date();
  const stale = new Date(now.getTime() - 60 * 60 * 1000);

  const missed = await WellnessCheckin.find({
    status: 'sent',
    responseAt: null,
    sentAt: { $lt: stale },
    familyAlertSent: false,
  }).populate('parent');

  for (const c of missed) {
    c.status = 'missed';
    c.familyAlertSent = true;
    await c.save();

    const links = await FamilyLink.find({ parent: c.parent?._id || c.parent, status: 'active' }).select('child');
    await Notification.insertMany(
      links.map((l) => ({
        recipient: l.child,
        type: 'checkin_missed',
        title: 'Wellness check-in not received',
        body: `No response to the ${c.checkinType} check-in. This is not proof of an emergency — consider calling your parent.`,
        data: { checkinId: c._id },
      }))
    );
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
function startJobs() {
  if (config.env === 'test') return;

  // Every minute: create due reminder events (idempotent)
  cron.schedule('* * * * *', () => {
    processDueReminders().catch((e) => console.error('[Job] processDueReminders:', e.message));
  });

  // Every 5 minutes: follow-ups + missed check-ins
  cron.schedule('*/5 * * * *', () => {
    processMissedFollowUps().catch((e) => console.error('[Job] processMissedFollowUps:', e.message));
    processMissedCheckins().catch((e) => console.error('[Job] processMissedCheckins:', e.message));
  });

  // Every minute at second 0: wellness check-in scheduling (minute-aligned)
  cron.schedule('0 * * * *', () => {
    scheduleCheckins().catch((e) => console.error('[Job] scheduleCheckins:', e.message));
  });

  console.log('[Job] Background scheduler started (IST-based reminders, check-ins, follow-ups).');
}

module.exports = {
  startJobs,
  processDueReminders,
  processMissedFollowUps,
  scheduleCheckins,
  processMissedCheckins,
};
