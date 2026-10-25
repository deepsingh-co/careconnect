/**
 * CareConnect — WhatsApp send test
 *
 * Verifies your Meta Cloud API credentials work by sending a real freeform
 * message to a phone number you specify.
 *
 * Usage:
 *   node scripts/test-whatsapp.js <recipientPhone> [message]
 *
 * Example (international format, no + or spaces):
 *   node scripts/test-whatsapp.js 919876543210 "Hello from CareConnect"
 *
 * IMPORTANT: during Meta test mode the recipient must be added under
 * developers.facebook.com -> your app -> WhatsApp -> API Setup -> "To".
 *
 * This is a dev-only helper. It does not touch your database.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const config = require('../src/config');
const whatsapp = require('../src/services/whatsappService');

async function main() {
  const [, , recipient, ...rest] = process.argv;
  const text = rest.join(' ') || 'Hello from CareConnect!';

  if (!recipient) {
    console.error('Usage: node scripts/test-whatsapp.js <recipientPhone> [message]');
    console.error('e.g.   node scripts/test-whatsapp.js 919876543210 "Hi there"');
    process.exit(1);
  }

  console.log('--- WhatsApp config ---');
  console.log('provider        :', config.whatsapp.provider || '(demo — NOT set)');
  console.log('phone number id :', config.whatsapp.meta.phoneNumberId || '(missing)');
  console.log('token present   :', config.whatsapp.meta.token ? 'yes' : '(missing)');
  console.log('recipient       :', recipient);
  console.log('-----------------------');

  if (whatsapp.isDemo) {
    console.error('\nFAIL: WHATSAPP_PROVIDER is empty, so you are in demo mode.');
    console.error('Set WHATSAPP_PROVIDER=meta in server/.env first.');
    process.exit(1);
  }

  if (!config.whatsapp.meta.phoneNumberId || !config.whatsapp.meta.token) {
    console.error('\nFAIL: META_WHATSAPP_PHONE_NUMBER_ID and META_WHATSAPP_TOKEN are required.');
    console.error('Fill them in server/.env, then re-run this script.');
    process.exit(1);
  }

  try {
    const result = await whatsapp.sendMessage(recipient, text);
    console.log('\nSUCCESS — message accepted by Meta.');
    console.log('messageId:', result.messageId || '(none returned)');
    console.log('\nIt should arrive on the phone within a few seconds.');
    console.log('If it does not: confirm the number is a registered tester under');
    console.log('API Setup -> To, and that the recipient is in international format.');
  } catch (err) {
    console.error('\nFAIL:', err.message);
    process.exit(1);
  }
}

main();
