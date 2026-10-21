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
const { rideProviders, foodProviders, homeServiceProviders } = require('../services/integrationAdapters');
const { rideHandoffs, rideHandoffFor, foodHandoffs } = require('../services/handoffLinks');

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

// ── Web Simulator (demo only) ─────────────────────────────────────────────────
/**
 * Processes a message through the exact same engine as the WhatsApp webhook,
 * capturing the bot's outgoing replies so the web chat can render them.
 * No real WhatsApp message is sent.
 */
exports.simulate = async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required.' });
    }

    const from = req.user.phone;
    if (!from) {
      return res.status(400).json({ success: false, message: 'Your account has no phone number configured.' });
    }

    const capture = whatsappService.startCapture();
    try {
      await handleIncomingMessage({
        from,
        id: `sim_${req.user._id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        text: message,
        type: 'text',
      });
    } finally {
      whatsappService.stopCapture();
    }

    res.json({
      success: true,
      data: {
        // Only show replies addressed to this parent — family verification
        // messages go to children's phones (also captured for transparency).
        replies: capture.filter((c) => c.to === from).map((c) => ({ text: c.text, at: c.at })),
        familyNotified: capture.filter((c) => c.to !== from).map((c) => ({ text: c.text, at: c.at })),
      },
      demoMode: true,
      notice: 'Demo simulator: messages are processed by the same engine as the WhatsApp webhook. Nothing is sent on real WhatsApp.',
    });
  } catch (err) {
    next(err);
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

  // Handle pending multi-step flows (ride quote choice, food menu choice)
  const stateHandled = await handlePendingState(session, parentUser, from, messageText);
  if (stateHandled) return;

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
      if (intent.details?.destination) {
        await sendRideQuotes(session, from, intent.details.destination);
      } else {
        session.state = 'collecting_ride';
        session.pendingIntent = 'ride_booking';
        session.pendingData = intent.details || {};
        await session.save();
        await whatsappService.sendMessage(from, getMsg('ride_ask_destination', lang));
      }
      break;

    case 'food_order':
      await sendFoodMenu(session, from);
      break;

    case 'home_cleaning':
    case 'gardening':
    case 'car_wash':
    case 'other_home_service':
    case 'plumbing':
    case 'electrical': {
      const uc = homeServiceProviders.bookService({ categoryId: intent.intent });
      if (parentUser) {
        await ServiceBooking.create({
          parent: parentUser._id,
          requestedBy: parentUser._id,
          serviceCategory: intent.intent === 'other_home_service' ? 'other_home_service' : intent.intent,
          description: originalText,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
          status: 'requested',
          sourceChannel: 'whatsapp',
          demoBookingRef: uc.ref,
        });
        await notifyChildren(
          parentUser,
          'Service requested via WhatsApp',
          `Your parent requested a home service (${intent.intent.replace(/_/g, ' ')}) via ${uc.platform}. DEMO ref: ${uc.ref}. Please verify.`,
          'booking_new',
          {}
        );
      }
      await whatsappService.sendMessage(
        from,
        t(
          lang,
          `Your service request has been received (DEMO booking via ${uc.platform}). Ref: ${uc.ref}. ${uc.proName} (rating ${uc.proRating}) — ${uc.arrivalWindow}. Your family has been notified for verification.`,
          `Aapki service request mil gayi (DEMO booking via ${uc.platform}). Ref: ${uc.ref}. ${uc.proName} ${uc.arrivalWindow} aayenge. Parivaar ko bata diya.`,
          `Service request mil gayi (DEMO via ${uc.platform})! Ref: ${uc.ref}. ${uc.proName} kal aayenge. Family ko bata diya.`
        )
      );
      break;
    }

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

// ── Multi-step flow helpers (DEMO-mode integrations) ──────────────────────────
function t(lang, en, hi, hinglish) {
  if (lang === 'hi') return hi;
  if (lang === 'hinglish') return hinglish;
  return en;
}

/**
 * Handles pending conversation flows:
 *  - collecting_ride: message is treated as destination → send Ola/Uber/Rapido price comparison
 *  - awaiting_ride_choice: number selects a provider → DEMO ride booking
 *  - awaiting_food_choice: numbers select menu items → DEMO food order (Zomato-style)
 */
async function handlePendingState(session, parentUser, from, text) {
  const clean = text.trim().toLowerCase();
  const lang = session.language;

  if (session.state === 'collecting_ride' && clean.length >= 3) {
    await sendRideQuotes(session, from, text.trim());
    return true;
  }

  if (session.state === 'awaiting_ride_choice' && parentUser) {
    const n = parseInt(clean, 10);
    const comparison = session.pendingData?.comparison || [];
    if (!Number.isInteger(n) || n < 1 || n > comparison.length) return false;

    const chosen = comparison[n - 1];
    const destination = session.pendingData.destination;
    const pickup = session.pendingData.pickup || 'Home';

    const booking = rideProviders.bookRide({
      providerId: chosen.providerId,
      vehicleId: chosen.vehicleId,
      pickup,
      destination,
    });

    const ride = await RideRequest.create({
      parent: parentUser._id,
      requestedBy: parentUser._id,
      pickup: { address: pickup },
      destination: { address: destination },
      scheduledAt: session.pendingData.scheduledAt ? new Date(session.pendingData.scheduledAt) : new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: 'requested',
      isDemo: true,
      externalProvider: booking.providerId,
      demoBookingRef: booking.ref,
      estimatedFare: booking.price,
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      vehicleDetails: booking.vehicleDetails,
      sourceChannel: 'whatsapp',
    });

    await notifyChildren(
      parentUser,
      'Ride booked via WhatsApp — verification needed',
      `Your parent booked a ride: ${booking.providerName} ${booking.vehicleLabel} to ${destination}, ₹${booking.price} (DEMO ref: ${booking.ref}). Please verify with them.`,
      'booking_new',
      { rideId: ride._id }
    );

    session.state = 'idle';
    session.pendingIntent = null;
    session.pendingData = null;
    await session.save();

    await whatsappService.sendMessage(
      from,
      t(
        lang,
        `✅ Ride booked (DEMO): ${booking.providerName} ${booking.vehicleLabel} to ${destination}.\nFare: ₹${booking.price} (~${booking.etaMin} min away).\nRef: ${booking.ref}\nDriver: ${booking.driverName}. Your family has been informed to verify.\n\nFor a real ride right now, book here:\n${rideHandoffFor(booking.providerId, { pickup, destination }).url}`,
        `✅ Ride book ho gayi (DEMO): ${booking.providerName} ${booking.vehicleLabel}, ${destination}.\nKiraya: ₹${booking.price} (~${booking.etaMin} min).\nRef: ${booking.ref}\nDriver: ${booking.driverName}. Parivaar ko verify karne ke liye bata diya.\n\nAsli ride turant book karne ke liye yahan kholein:\n${rideHandoffFor(booking.providerId, { pickup, destination }).url}`,
        `✅ Ride booked (DEMO)! ${booking.providerName} ${booking.vehicleLabel} → ${destination}. ₹${booking.price}, ~${booking.etaMin} min. Ref: ${booking.ref}. Family ko verify karne bola hai.\n\nReal ride abhi book karne ke liye:\n${rideHandoffFor(booking.providerId, { pickup, destination }).url}`
      )
    );
    return true;
  }

  if (session.state === 'awaiting_food_choice' && parentUser) {
    const nums = clean
      .split(/[\s,]+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => Number.isInteger(n));
    const menu = session.pendingData?.menu || [];
    const chosen = nums.map((n) => menu[n - 1]).filter(Boolean);
    if (!chosen.length) return false;

    const items = chosen.map((m) => ({ itemId: m.id, name: m.name, quantity: 1, unitPrice: m.price }));
    const placement = foodProviders.placeOrder({ items });

    const order = await FoodOrder.create({
      parent: parentUser._id,
      requestedBy: parentUser._id,
      items,
      isDemo: true,
      status: 'placed',
      restaurantName: placement.restaurantName,
      demoBookingRef: placement.ref,
      estimatedTotal: placement.estimatedTotal,
      sourceChannel: 'whatsapp',
    });

    await notifyChildren(
      parentUser,
      'Food order placed via WhatsApp — verification needed',
      `Your parent ordered food from ${placement.restaurantName}: ${items.map((i) => i.name).join(', ')} — ₹${placement.estimatedTotal} (DEMO ref: ${placement.ref}). Please verify.`,
      'booking_new',
      { orderId: order._id }
    );

    session.state = 'idle';
    session.pendingIntent = null;
    session.pendingData = null;
    await session.save();

    await whatsappService.sendMessage(
      from,
      t(
        lang,
        `✅ Order placed (DEMO): ${placement.restaurantName}.\nItems: ${items.map((i) => i.name).join(', ')}.\nTotal: ₹${placement.estimatedTotal} • ETA ~${placement.etaMin} min.\nRef: ${placement.ref}. Your family has been informed to verify.`,
        `✅ Order ho gaya (DEMO): ${placement.restaurantName}.\nItems: ${items.map((i) => i.name).join(', ')}.\nTotal: ₹${placement.estimatedTotal} • ETA ~${placement.etaMin} min.\nRef: ${placement.ref}. Parivaar ko bata diya.`,
        `✅ Order placed (DEMO)! ${items.map((i) => i.name).join(', ')} — ₹${placement.estimatedTotal}. Ref: ${placement.ref}. Family ko verify karne bola hai.`
      )
    );
    return true;
  }

  return false;
}

/** Sends the Ola/Uber/Rapido DEMO price comparison and sets the choice state. */
async function sendRideQuotes(session, from, destination) {
  const lang = session.language;
  const pickup = 'Home';
  const comparison = rideProviders.getComparison({ pickup, destination });

  session.state = 'awaiting_ride_choice';
  session.pendingIntent = 'ride_booking';
  session.pendingData = {
    pickup,
    destination,
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    comparison,
  };
  await session.save();

  const lines = comparison.map((q, i) => `${i + 1}. ${q.providerName} ${q.vehicleLabel} — ₹${q.price} (~${q.etaMin} min)`);
  const linkLines = rideHandoffs({ pickup, destination })
    .filter((h) => h.providerId !== 'rapido')
    .map((h) => `${h.providerName}: ${h.url}`)
    .join('\n');
  await whatsappService.sendMessage(
    from,
    t(
      lang,
      `Ride options to ${destination} (DEMO prices — Ola / Uber / Rapido comparison):\n${lines.join('\n')}\n\nReply with a number to book your ride.\n\nBook a real ride in the provider's app:\n${linkLines}`,
      `Aapki ride ke options — ${destination} (DEMO prices, Ola / Uber / Rapido):\n${lines.join('\n')}\n\nNumber bhejein book karne ke liye.\n\nAsli ride ke liye provider app mein book karein:\n${linkLines}`,
      `Ride options (${destination}) — DEMO price compare:\n${lines.join('\n')}\n\nNumber reply karein book karne ke liye.\n\nReal ride ke liye yahan book karein:\n${linkLines}`
    )
  );
}

/** Sends the Zomato-style DEMO menu and sets the food choice state. */
async function sendFoodMenu(session, from) {
  const lang = session.language;
  const menu = foodProviders.getMenu().slice(0, 8);

  session.state = 'awaiting_food_choice';
  session.pendingIntent = 'food_order';
  session.pendingData = { menu: menu.map((m) => ({ id: m.id, name: m.name, price: m.price })) };
  await session.save();

  const lines = menu.map((m, i) => `${i + 1}. ${m.name} — ₹${m.price}`);
  const linkLines = foodHandoffs()
    .filter((h) => h.providerId !== 'maps')
    .map((h) => `${h.providerName}: ${h.url}`)
    .join('\n');
  await whatsappService.sendMessage(
    from,
    t(
      lang,
      `Here is today's menu (DEMO — Zomato-style catalogue):\n${lines.join('\n')}\n\nReply with item numbers (e.g. 1, 3) to place your order.\n\nFor real food delivery:\n${linkLines}`,
      `Aaj ka menu (DEMO):\n${lines.join('\n')}\n\nItem numbers bhejein order ke liye (jaise 1, 3).\n\nAsli food order ke liye:\n${linkLines}`,
      `Aaj ka menu (DEMO):\n${lines.join('\n')}\n\nNumber bhejo order karne ke liye, jaise: 1,3\n\nReal food delivery ke liye:\n${linkLines}`
    )
  );
}

/** Notify all linked family members (Notification + WhatsApp if number present). */
async function notifyChildren(parentUser, title, body, type, data) {
  if (!parentUser) return;
  const links = await FamilyLink.find({ parent: parentUser._id, status: 'active' }).populate('child', 'name phone');
  for (const link of links) {
    const childId = link.child?._id || link.child;
    await Notification.create({ recipient: childId, type, title, body, data });
    if (link.child?.phone) {
      await whatsappService.sendMessage(link.child.phone, `[CareConnect • DEMO] ${body}`);
    }
  }
}


// ── Response messages ─────────────────────────────────────────────────────────
function getMsg(key, lang) {
  const messages = {
    checkin_recorded: {
      en: 'Great! Your wellness check-in has been recorded. Glad to hear you are doing well.',
      hi: 'Achha! Aapka wellness check-in record ho gaya. Aap theek hain yeh sunkar achha laga.',
      hinglish: 'Great! Aapka wellness check-in ho gaya. Achha laga sunke!',
    },
    ride_ask_destination: {
      en: 'Sure, I will help you book a ride. Where do you want to go? Please tell me the destination.',
      hi: 'Bilkul, main ride book karne mein madad karunga. Kahan jaana hai? Destination batayein.',
      hinglish: 'Ride book kar dete hain! Kahan jaana hai? Destination batao.',
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
