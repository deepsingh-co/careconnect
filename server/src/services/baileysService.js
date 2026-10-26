/**
 * Baileys WhatsApp Channel (unofficial WhatsApp Web API)
 * ─────────────────────────────────────────────────────────────────────────────
 * Links CareConnect to a REAL WhatsApp number by scanning a QR code
 * (WhatsApp → Linked devices → Link a device). No Meta / WABA / template
 * approval needed, and every message is free.
 *
 * BAN SAFETY (read before going live):
 *  - Use a DEDICATED number — never your personal or main business number.
 *  - Reply-only pattern: this service only answers messages parents send first
 *    (customer-initiated traffic) — it never blasts strangers.
 *  - Single session: only this server should hold the linked device.
 *
 * Inbound messages are handed to the same pipeline as the Meta webhook
 * (webhookController.handleIncomingMessage) so intents, orders and family
 * notifications behave identically across channels.
 *
 * Session files live in server/.baileys-auth/ (gitignored) and survive restarts.
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');

/** Live channel state — exposed to the admin Integrations page. */
const state = {
  state: 'disconnected', // 'disabled' | 'disconnected' | 'connecting' | 'qr' | 'open'
  qr: null, // QR as a data-URL for the admin scanner UI
  phone: null, // linked number in E.164 (+91…), null until connected
  since: null, // ISO timestamp of the current connection
  lastError: null,
};

let sock = null;
let connecting = false;
let reconnectTimer = null;
let inboundHandler = null;

/** '919876543210@s.whatsapp.net' → '+919876543210' (DB phone format). */
const jidToPhone = (jid) => {
  const user = String(jid || '').split('@')[0].split(':')[0];
  const digits = user.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};

/** '+919876543210' | '919876543210' → '919876543210@s.whatsapp.net'. */
const phoneToJid = (to) => {
  const digits = String(to || '').replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : '';
};

/** Best-effort text extraction across WhatsApp message shapes. */
const extractText = (message) => {
  if (!message || typeof message !== 'object') return null;
  if (typeof message.conversation === 'string') return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;
  if (message.documentMessage?.caption) return message.documentMessage.caption;
  if (message.buttonsResponseMessage?.selectedDisplayText) return message.buttonsResponseMessage.selectedDisplayText;
  if (message.templateButtonReplyMessage?.selectedDisplayText) return message.templateButtonReplyMessage.selectedDisplayText;
  if (message.listResponseMessage?.title) return message.listResponseMessage.title;
  // Wrapped payloads → unwrap once
  const wrapped =
    message.ephemeralMessage?.message ||
    message.viewOnceMessage?.message ||
    message.viewOnceMessageV2?.message ||
    message.editedMessage?.message ||
    message.documentWithCaptionMessage?.message;
  if (wrapped) return extractText(wrapped);
  return null;
};

/** True once a WhatsApp number has been linked (QR scanned at least once). */
const hasSession = () => {
  try {
    return fs.existsSync(path.join(config.whatsapp.baileys.authDir, 'creds.json'));
  } catch {
    return false;
  }
};

const getStatus = () => ({
  provider: 'baileys',
  enabled: config.whatsapp.provider === 'baileys',
  state: config.whatsapp.provider === 'baileys' ? state.state : 'disabled',
  qr: state.qr,
  phone: state.phone,
  since: state.since,
  lastError: state.lastError,
  sessionExists: hasSession(),
});

/** app.js wires the shared inbound pipeline once at startup. */
const setInboundHandler = (handler) => {
  inboundHandler = handler;
};

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect().catch((err) => console.error('[Baileys] Reconnect failed:', err.message));
  }, 3000);
  if (typeof reconnectTimer.unref === 'function') reconnectTimer.unref();
}

/** Route one inbound WhatsApp Web message into the shared chatbot pipeline. */
async function handleIncoming(m) {
  if (!m || !m.message) return;

  const fromMe = Boolean(m.key && m.key.fromMe);
  const text = extractText(m.message);
  const rawJid = (m.key && m.key.remoteJid) || '';

  // WhatsApp privacy addressing: chats can arrive as `<lid>@lid` instead of
  // `<number>@s.whatsapp.net`. The phone jid rides along as remoteJidAlt when
  // present; otherwise ask Baileys' LID mapping store to resolve it.
  let jid = rawJid;
  const alt = (m.key && m.key.remoteJidAlt) || '';
  if (!jid.endsWith('@s.whatsapp.net') && alt.endsWith('@s.whatsapp.net')) {
    jid = alt;
  }
  if (jid.endsWith('@lid')) {
    try {
      const pn =
        sock && sock.signalRepository ? await sock.signalRepository.lidMapping.getPNForLID(jid) : null;
      const digits = String(pn || '').replace(/\D/g, '');
      if (digits) jid = `${digits}@s.whatsapp.net`;
    } catch (err) {
      console.warn(`[Baileys] LID→number lookup failed for ${jid}: ${err.message}`);
    }
  }

  // One-line trace for every live message so operators can see what arrived
  // and why something was skipped (reply-only bot = fromMe must be ignored).
  if (!fromMe && rawJid && rawJid !== 'status@broadcast') {
    console.log(`[Baileys] ← ${rawJid}${rawJid !== jid ? ` → ${jid}` : ''}${text !== null ? `: ${String(text).slice(0, 80)}` : ' (no text)'}`);
  }

  if (!inboundHandler) {
    console.warn('[Baileys] No inbound handler wired — message dropped.');
    return;
  }
  if (fromMe) return; // our own outgoing traffic — never feed it back in

  // Only direct 1:1 chats on the phone-number domain (skip groups/status/LIDs).
  if (!jid.endsWith('@s.whatsapp.net')) {
    console.warn(`[Baileys] Skipping — could not resolve sender to a phone number: ${rawJid}`);
    return;
  }

  const from = jidToPhone(jid);
  // Media/protocol noise without a caption is ignored — the bot stays reply-only.
  if (!from || text === null) return;

  await inboundHandler({
    from,
    id: (m.key && m.key.id) || `wa_${Date.now()}`,
    text,
    type: 'text',
    provider: 'baileys',
  });
}

/** Start (or resume) the WhatsApp Web session. Idempotent. */
async function connect() {
  if (config.whatsapp.provider !== 'baileys') {
    state.state = 'disabled';
    return getStatus();
  }
  if (sock || connecting) return getStatus();

  connecting = true;
  state.state = 'connecting';
  state.lastError = null;

  try {
    const baileys = require('@whiskeysockets/baileys');
    const makeWASocket = baileys.makeWASocket || baileys.default;
    const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;
    const pino = require('pino');
    const QRCode = require('qrcode');

    fs.mkdirSync(config.whatsapp.baileys.authDir, { recursive: true });
    const { state: authState, saveCreds } = await useMultiFileAuthState(config.whatsapp.baileys.authDir);

    let version;
    try {
      version = (await fetchLatestBaileysVersion()).version;
    } catch {
      // Offline / version endpoint down → keep Baileys' bundled default.
    }

    const wa = makeWASocket({
      auth: authState,
      version,
      browser: Browsers.ubuntu('Chrome'),
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });
    sock = wa;
    console.log('[Baileys] Connecting to WhatsApp Web…');

    wa.ev.on('creds.update', saveCreds);

    wa.ev.on('connection.update', async (update) => {
      try {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          state.state = 'qr';
          state.lastError = null;
          try {
            state.qr = await QRCode.toDataURL(qr);
          } catch {
            state.qr = null;
          }
          console.log('[Baileys] QR ready — scan it on the phone: WhatsApp → Linked devices → Link a device.');
        }

        if (connection === 'open') {
          state.state = 'open';
          state.qr = null;
          state.lastError = null;
          state.phone = jidToPhone(wa.user && wa.user.id);
          state.since = new Date().toISOString();
          console.log(`[Baileys] Linked WhatsApp number: ${state.phone || 'unknown'} — replies are live.`);
        }

        if (connection === 'close') {
          if (sock !== wa) return; // stale socket (restart() already replaced it)
          sock = null;
          state.qr = null;
          state.state = 'disconnected';

          const code =
            lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
              ? lastDisconnect.error.output.statusCode
              : undefined;

          if (code === DisconnectReason.loggedOut) {
            state.phone = null;
            state.since = null;
            state.lastError = 'Logged out of WhatsApp — scan the QR code again (Admin → Integrations).';
            console.warn('[Baileys] Logged out. Scan the QR code again to re-link.');
            return;
          }

          state.lastError = 'Connection lost — reconnecting…';
          console.warn('[Baileys] Connection closed — retrying in 3s…');
          scheduleReconnect();
        }
      } catch (err) {
        console.error('[Baileys] connection.update handler error:', err.message);
      }
    });

    wa.ev.on('messages.upsert', async (event) => {
      try {
        // 'notify' = live messages; other types are history syncs we don't want.
        if (event && event.type && event.type !== 'notify') return;
        for (const m of (event && event.messages) || []) {
          await handleIncoming(m);
        }
      } catch (err) {
        console.error('[Baileys] messages.upsert error:', err.message);
      }
    });

    wa.ev.on('error', (err) => {
      console.error('[Baileys] Socket error:', err && err.message ? err.message : err);
    });
  } catch (err) {
    state.state = 'disconnected';
    state.lastError = err.message;
    console.error('[Baileys] Could not start:', err.message);
  } finally {
    connecting = false;
  }

  return getStatus();
}

/** Drop the current session and pair again (fresh QR). */
async function restart() {
  if (config.whatsapp.provider !== 'baileys') {
    const error = new Error('WhatsApp provider is not baileys — nothing to restart.');
    error.statusCode = 400;
    throw error;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const old = sock;
  sock = null;
  state.state = 'disconnected';
  state.qr = null;
  try {
    if (old) old.end(undefined);
  } catch {
    /* socket already gone */
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
  return connect();
}

/** Send a freeform text message through the linked WhatsApp number. */
async function sendText(to, text) {
  if (state.state !== 'open' || !sock) {
    const error = new Error(
      'WhatsApp number is not linked yet. Scan the QR code in Admin → Integrations, then retry.'
    );
    error.statusCode = 503;
    throw error;
  }

  const jid = phoneToJid(to);
  if (!jid) {
    const error = new Error(`Invalid recipient phone number: ${to}`);
    error.statusCode = 400;
    throw error;
  }

  const sent = await sock.sendMessage(jid, { text: String(text) });
  return {
    success: true,
    provider: 'baileys',
    to,
    messageId: (sent && sent.key && sent.key.id) || null,
  };
}

module.exports = {
  connect,
  restart,
  sendText,
  getStatus,
  hasSession,
  setInboundHandler,
  jidToPhone,
  phoneToJid,
  extractText,
};
