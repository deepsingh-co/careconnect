/**
 * WhatsApp Webhook Controller
 * Handles incoming messages, processes intents, manages conversation state
 */
const config = require('../config');
const whatsappService = require('../services/whatsappService');
const aiService = require('../services/aiService');
const ConversationSession = require('../models/ConversationSession');
const User = require('../models/User');
const EmergencyAlert = require('../models/EmergencyAlert');
const RideRequest = require('../models/RideRequest');
const FoodOrder = require('../models/FoodOrder');
const ServiceBooking = require('../models/ServiceBooking');
const WellnessCheckin = require('../models/WellnessCheckin');
const ReminderEvent = require('../models/ReminderEvent');
const FamilyLink = require('../models/FamilyLink');
const Notification = require('../models/Notification');

// ── Webhook Verification (Meta only) ─────────────────────────────────────────
exports.verify = (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === config.whatsapp.meta.webhookVerifyToken) {
    console.log('[Webhook] Verified.');
    return res.send(challenge);
  }
  res.sendStatus(403);
};

// ── Incoming Message Handler ──────────────────────────────────────────────────
exports.receive = async (req, res) => {
  // Always respond 200 immediately to prevent retries
  res.sendStatus(200);

  try {
    await processWebhookPayload(req.body, req.rawBody, req.headers['x-hub-signature-256']);
  } catch (err) {
    console.error('[Webhook] Processing error:', err.message);
  }
};

async function processWebhookPayload(body, rawBody, signature) {
  // Verify signature for Meta
  if (config.whatsapp.provider === 'meta' && rawBody) {
    const valid = whatsappService.verifyMetaSignature(rawBody, signature);
    if (!valid) {
      console.warn('[Webhook] Invalid signature — ignoring.');
      return;
    }
  }

  // Extract messages based on provider format
  let messages = [];

  if (config.whatsapp.provider === 'meta' || !config.whatsapp.provider) {
    // Meta Cloud API format
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    if (value?.messages) messages = value.messages.map((m) => ({
      from: m.from,
      id: m.id,
      text: m.type === 'text' ? m.text?.body : `[${m.type} message]`,
      type: m.type,
    }));
  } else if (config.whatsapp.provider === 'twilio') {
    // Twilio webhook format
    const from = body?.From?.replace('whatsapp:', '');
    const text = body?.Body;
    if (from && text) messages = [{ from, id: body?.MessageSid, text, type: 'text' }];
  }

  for (const msg of messages) {
    await handleIncomingMessage(msg);
  }
}

async function handleIncomingMessage(msg) {
  const { from, id, text } = msg;

  // Deduplication: skip if we've seen this message ID
  const session = await ConversationSession.findOneAndUpdate(
    { whatsappNumber: from },
    { $setOnInsert: { whatsappNumber: from } },
    { upsert: true, new: true }
  );

  if (session.processedMessageIds.includes(id)) {
    console.log(`[Webhook] Duplicate message ${id} — skipping.`);
    return;
  }

  session.processedMessageIds.push(id);
  session.lastMessageAt = new Date();
  await session.save();

  // Find the parent user by phone number
  const parentUser = await User.findOne({ phone: from, role: 'parent' });
  if (parentUser) session.parent = parentUser._id;

  const messageText = text || '';

  // Check for emergency keywords first (highest priority)
  const emergencyKeywords = ['help', 'emergency', 'sos', 'madad', 'dard', '112', 'fell', 'gira'];
  const isEmergency = emergencyKeywords.some((kw) => messageText.toLowerCase().includes(kw));

  if (isEmergency) {
    await handleEmergency(session, parentUser, messageText);
    return;
  }

  // Check for reminder acknowledgement
  const ackKeywords = { taken: ['taken', 'liya', 'li', 'yes', 'haan', 'done'], remind_later: ['later', 'baad', 'remind', 'wait'], need_help: ['need help', 'help', 'nahi', 'no'] };
  for (const [ack, keywords] of Object.entries(ackKeywords)) {
    if (keywords.some((kw) => messageText.toLowerCase().includes(kw)) && session.state === 'idle') {
      // Check if there's a pending reminder event
      if (parentUser) {
        const pendingEvent = await ReminderEvent.findOne({
          parent: parentUser._id,
          acknowledgement: null,
          scheduledAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        }).sort({ scheduledAt: -1 });

        if (pendingEvent) {
          pendingEvent.acknowledgement = ack;
          pendingEvent.acknowledgedAt = new Date();
          await pendingEvent.save();
          await whatsappService.sendMessage(from, getAckResponse(ack, session.language));
          return;
        }
      }
    }
  }

  // AI intent detection
  const intent = await aiService.detectIntent(messageText);
  session.language = intent.language || session.language;
  await session.save();

  await routeIntent(intent, session, parentUser, from, messageText);
}

async function routeIntent(intent, session, parentUser, from, originalText) {
  const lang = session.language;

  switch (intent.intent) {
    case 'emergency_help':
      await handleEmergency(session, parentUser, originalText);
      break;

    case 'wellness_checkin':
      if (parentUser) {
        await WellnessCheckin.create({
          parent: parentUser._id,
          scheduledAt: new Date(),
          sentAt: new Date(),
          responseAt: new Date(),
          status: 'responded',
          mood: 'good',
          idempotencyKey: `wa_checkin_${session._id}_${Date.now()}`,
        });
      }
      await whatsappService.sendMessage(from, getMsg('checkin_recorded', lang));
      break;

    case 'ride_booking':
      session.state = 'collecting_ride';
      session.pendingIntent = 'ride_booking';
      session.pendingData = intent.details || {};
      await session.save();
      await whatsappService.sendMessage(from, getMsg('ride_instructions', lang));
      break;

    case 'food_order':
      await whatsappService.sendMessage(from, getMsg('food_menu', lang));
      break;

    case 'home_cleaning':
    case 'gardening':
    case 'car_wash':
    case 'other_home_service':
      if (parentUser) {
        await ServiceBooking.create({
          parent: parentUser._id,
          requestedBy: parentUser._id,
          serviceCategory: intent.intent === 'other_home_service' ? 'other_home_service' : intent.intent,
          description: originalText,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
          status: 'requested',
          sourceChannel: 'whatsapp',
        });
        // Notify family
        const links = await FamilyLink.find({ parent: parentUser._id, status: 'active' });
        for (const link of links) {
          await Notification.create({
            recipient: link.child,
            type: 'booking_new',
            title: 'Service requested via WhatsApp',
            body: `Your parent requested: ${intent.intent.replace(/_/g, ' ')}`,
            data: {},
          });
        }
      }
      await whatsappService.sendMessage(from, getMsg('service_received', lang));
      break;

    case 'medicine_reminder':
      await whatsappService.sendMessage(from, getMsg('reminder_setup', lang));
      break;

    case 'booking_status':
      if (parentUser) {
        const latestBooking = await ServiceBooking.findOne({ parent: parentUser._id })
          .sort({ createdAt: -1 });
        if (latestBooking) {
          await whatsappService.sendMessage(from, `Your latest booking status: ${latestBooking.status.replace(/_/g, ' ')}.`);
        } else {
          await whatsappService.sendMessage(from, getMsg('no_bookings', lang));
        }
      } else {
        await whatsappService.sendMessage(from, getMsg('not_registered', lang));
      }
      break;

    case 'human_support':
      await whatsappService.sendMessage(from, getMsg('human_support', lang));
      break;

    default:
      await whatsappService.sendMessage(from, getMsg('unknown', lang));
  }
}

async function handleEmergency(session, parentUser, message) {
  const from = session.whatsappNumber;
  const lang = session.language;

  if (parentUser) {
    await EmergencyAlert.create({
      parent: parentUser._id,
      triggeredBy: 'whatsapp',
      message,
      assistanceType: 'unknown',
    });

    // Notify family
    const links = await FamilyLink.find({ parent: parentUser._id, status: 'active' });
    for (const link of links) {
      await Notification.create({
        recipient: link.child,
        type: 'emergency_alert',
        title: 'EMERGENCY ALERT from parent',
        body: `Your parent sent an emergency message via WhatsApp: "${message}". Please contact them immediately.`,
        data: {},
      });
    }
  }

  await whatsappService.sendMessage(
    from,
    lang === 'hi' || lang === 'hinglish'
      ? 'Aapko turant madad chahiye? Kripya 112 (Ambulance) ya apne parivaar ko call karein. Hum aapke pariwar ko bata rahe hain.'
      : 'Do you need immediate help? Please call 112 (Emergency) or your family. We are alerting your family members now. CareConnect does not dispatch emergency services.'
  );
}

// ── Response messages ─────────────────────────────────────────────────────────
function getMsg(key, lang) {
  const messages = {
    checkin_recorded: {
      en: 'Great! Your wellness check-in has been recorded. Glad to hear you are doing well.',
      hi: 'Achha! Aapka wellness check-in record ho gaya. Aap theek hain yeh sunkar achha laga.',
      hinglish: 'Great! Aapka wellness check-in ho gaya. Achha laga sunke!',
    },
    ride_instructions: {
      en: 'I will help you book a ride. Please tell me: 1) Pickup address 2) Destination 3) Date and time.',
      hi: 'Main aapke liye ride book karta hun. Batayein: 1) Pickup jagah 2) Destination 3) Tarikh aur samay.',
      hinglish: 'Ride book karte hain. Batao: 1) Pickup 2) Destination 3) Date aur time.',
    },
    food_menu: {
      en: 'Please visit the CareConnect app to order food from our menu. A family member can also place the order for you.',
      hi: 'Khaane ke liye CareConnect app mein jaayein ya apne parivar se order karne ko kahein.',
      hinglish: 'CareConnect app se food order karein ya family se bolein.',
    },
    service_received: {
      en: 'Your service request has been received. Your family has been notified. We will confirm the booking shortly.',
      hi: 'Aapki service request mil gayi. Aapke parivaar ko bataa diya. Jaldi confirm karenge.',
      hinglish: 'Service request mil gayi! Family ko bata diya. Jaldi confirm hogi.',
    },
    reminder_setup: {
      en: 'To set up medicine reminders, please use the CareConnect app or ask a family member to set it up for you.',
      hi: 'Dawa ki yaad dilane ke liye CareConnect app use karein ya parivar se set karva lein.',
      hinglish: 'Medicine reminder ke liye CareConnect app use karein.',
    },
    no_bookings: {
      en: 'You have no recent bookings.',
      hi: 'Aapki koi recent booking nahi hai.',
      hinglish: 'Koi recent booking nahi hai.',
    },
    not_registered: {
      en: 'Your number is not registered with CareConnect. Please register through the app.',
      hi: 'Aapka number CareConnect mein registered nahi hai. App se register karein.',
      hinglish: 'Number registered nahi hai. App se sign up karein.',
    },
    human_support: {
      en: 'I am connecting you to our support team. A team member will respond shortly. For emergencies, call 112.',
      hi: 'Main aapko support team se jod raha hun. Koi jaldi reply karega. Emergency ke liye 112 call karein.',
      hinglish: 'Support team se connect kar raha hun. Woh jaldi reply karenge.',
    },
    unknown: {
      en: 'I did not quite understand. You can say: "Book a ride", "Order food", "Book cleaning", or "I need help".',
      hi: 'Samjha nahi. Aap keh sakte hain: "Ride chahiye", "Khana mangao", "Safai karni hai", ya "Help chahiye".',
      hinglish: 'Samjha nahi. Try karein: "Ride book karo", "Khana order karo", ya "Help chahiye".',
    },
  };

  return messages[key]?.[lang] || messages[key]?.en || 'Thank you for your message.';
}

function getAckResponse(ack, lang) {
  if (ack === 'taken') return lang === 'hi' ? 'Shukriya! Aapka dawa record ho gaya.' : 'Thank you! Medication recorded as taken.';
  if (ack === 'remind_later') return lang === 'hi' ? 'Theek hai, hum 30 minute mein yaad dilayenge.' : 'OK, we will remind you in 30 minutes.';
  if (ack === 'need_help') return lang === 'hi' ? 'Aapke parivar ko bata diya. Woh jaldi contact karenge.' : 'Your family has been notified. They will contact you soon.';
  return 'Acknowledged.';
}
