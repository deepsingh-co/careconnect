/**
 * CareConnect — WhatsApp send test
 *
 * Verifies the configured WhatsApp provider can deliver a real message to a
 * phone number you specify.
 *
 * Usage:
 *   node scripts/test-whatsapp.js <recipientPhone> [message]
 *
 * Example (international format, no + or spaces):
 *   node scripts/test-whatsapp.js 919876543210 "Hello from CareConnect"
 *
 * Providers:
 *   - meta    : sends directly through the Graph API (the server does not need
 *               to be running; during test mode the recipient must be added
 *               under developers.facebook.com → your app → WhatsApp → API Setup
 *               → "To").
 *   - baileys : the session lives in the running server, so this script talks
 *               to it over HTTP (login as admin → send). Start the server first
 *               and make sure a number is linked (Admin → Integrations).
 *               Override credentials with ADMIN_EMAIL / ADMIN_PASSWORD /
 *               SERVER_URL env vars if needed.
 *   - twilio  : sends directly through the Twilio SDK.
 *
 * This is a dev-only helper. It does not touch your database.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const config = require('../src/config');
const whatsapp = require('../src/services/whatsappService');

/** Baileys sessions live in the server process — send through its admin API. */
async function sendViaServer(base, recipient, text) {
  const axios = require('axios');
  const email = process.env.ADMIN_EMAIL || 'admin@demo.careconnect';
  const password = process.env.ADMIN_PASSWORD || 'Demo@1234';
  const opts = { headers: { 'Content-Type': 'application/json' }, timeout: 15000 };

  const login = await axios.post(`${base}/api/auth/login`, { email, password }, opts);
  const token = login.data?.data?.token;
  if (!token) throw new Error('Admin login failed — check ADMIN_EMAIL / ADMIN_PASSWORD.');
  const auth = { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` } };

  const channel = await axios.get(`${base}/api/admin/whatsapp/channel`, auth);
  const st = channel.data?.data || {};
  if (st.state !== 'open') {
    throw new Error(
      `Server WhatsApp channel state is "${st.state}" — open Admin → Integrations and ` +
        (st.state === 'qr' ? 'scan the QR code, then re-run this script.' : 'start/re-link the channel, then re-run.')
    );
  }

  const sent = await axios.post(`${base}/api/admin/whatsapp/channel/send`, { to: recipient, text }, auth);
  if (sent.data?.data?.demo) {
    throw new Error(
      'The message was simulated — no WhatsApp number is linked yet. Scan the QR in Admin → Integrations, then re-run.'
    );
  }
  return sent.data?.data || {};
}

async function main() {
  const [, , recipient, ...rest] = process.argv;
  const text = rest.join(' ') || 'Hello from CareConnect!';

  if (!recipient) {
    console.error('Usage: node scripts/test-whatsapp.js <recipientPhone> [message]');
    console.error('e.g.   node scripts/test-whatsapp.js 919876543210 "Hi there"');
    process.exit(1);
  }

  const provider = config.whatsapp.provider;
  console.log('--- WhatsApp config ---');
  console.log('provider        :', provider || '(not set)');
  console.log('mode            :', whatsapp.mode);
  if (provider === 'meta') {
    console.log('phone number id :', config.whatsapp.meta.phoneNumberId || '(missing)');
    console.log('token present   :', config.whatsapp.meta.token ? 'yes' : '(missing)');
  }
  console.log('recipient       :', recipient);
  console.log('-----------------------');

  if (whatsapp.isDemo) {
    console.error('\nFAIL: no WhatsApp number is linked, so nothing real is sent.');
    console.error(
      provider === 'baileys'
        ? 'Scan the QR in Admin → Integrations to link a number, then re-run this script.'
        : 'Set WHATSAPP_PROVIDER (and credentials) in server/.env, then re-run this script.'
    );
    process.exit(1);
  }

  try {
    const result =
      provider === 'baileys'
        ? await sendViaServer(process.env.SERVER_URL || `http://localhost:${config.port}`, recipient, text)
        : await whatsapp.sendMessage(recipient, text);

    console.log('\nSUCCESS — message accepted by', provider || 'the provider');
    console.log('messageId:', result.messageId || '(none returned)');
    console.log('\nIt should arrive on the phone within a few seconds.');
    if (provider === 'meta') {
      console.log('If it does not: confirm the number is a registered tester under');
      console.log('API Setup -> To, and that the recipient is in international format.');
    }
  } catch (err) {
    const detail = err.response?.data?.message || err.message;
    console.error('\nFAIL:', detail);
    process.exit(1);
  }
}

main();
