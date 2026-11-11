/**
 * Create (or check) the Meta WhatsApp Utility template used for child approval.
 *
 * Only the business owner can create the Business account / WABA and generate
 * the access token. Once that is done, this script submits the exact template
 * CareConnect expects, so the body, variables and quick-reply buttons cannot
 * drift from the server payload.
 *
 * Usage:
 *   1. Put these in server/.env (never commit .env):
 *        META_WHATSAPP_TOKEN=EAAG...            # system-user token
 *        META_WHATSAPP_BUSINESS_ACCOUNT_ID=...  # WABA ID; optional — the
 *                                               # script can discover it from
 *                                               # the token, but set it when
 *                                               # the token manages >1 WABA
 *   2. Run:
 *        npm run meta:template
 *
 * Required token permissions:
 *   - whatsapp_business_management  (create/read templates)
 *   - whatsapp_business_messaging   (send messages at runtime)
 *
 * If the template already exists this script only prints its review status.
 * Re-submitting is intentionally not attempted; edit it in WhatsApp Manager if
 * Meta rejected it.
 */
require('dotenv').config();
const axios = require('axios');

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';
const TOKEN = process.env.META_WHATSAPP_TOKEN || '';
const WABA_ID = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || '';
const TEMPLATE_NAME =
  process.env.META_WHATSAPP_APPROVAL_TEMPLATE || 'careconnect_approval_request';
const TEMPLATE_LANG = process.env.META_WHATSAPP_APPROVAL_TEMPLATE_LANG || 'en_US';

const BODY_TEXT = [
  'CareConnect - family approval needed',
  '',
  '{{1}} has requested {{2}}.',
  'Amount: {{3}}',
  'Approval code: {{4}}',
  '',
  'Tap Approve or Decline below. If the buttons do not work, reply APPROVE or DECLINE followed by the approval code.',
  'This request expires in {{5}} minutes.',
].join('\n');

const TEMPLATE_PAYLOAD = {
  name: TEMPLATE_NAME,
  language: TEMPLATE_LANG,
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: BODY_TEXT,
      example: {
        body_text: [['Ramesh Kumar', 'Food: Poha', '₹80', 'AB12CD', '15']],
      },
    },
    {
      type: 'BUTTONS',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Approve' },
        { type: 'QUICK_REPLY', text: 'Decline' },
      ],
    },
  ],
};

function fail(message) {
  console.error(`\n[meta:template] ${message}\n`);
  process.exit(1);
}

/**
 * Resolve the WABA ID from the token when the env var is missing.
 * `debug_token` lists the WhatsApp assets the token can manage; each candidate
 * is then checked against the message_templates edge.
 */
async function discoverWabaId(headers) {
  let data;
  try {
    const res = await axios.get(
      `https://graph.facebook.com/${GRAPH_VERSION}/debug_token`,
      {
        headers,
        params: { input_token: TOKEN },
        timeout: 20000,
      }
    );
    data = res.data?.data || {};
  } catch (err) {
    const detail = err.response?.data?.error;
    fail(
      `Could not inspect the token: ${detail?.message || err.message}. ` +
        'Set META_WHATSAPP_BUSINESS_ACCOUNT_ID manually.'
    );
  }

  if (data.expires_at && data.expires_at * 1000 < Date.now()) {
    fail('META_WHATSAPP_TOKEN has expired. Generate a new system-user token.');
  }
  if (data.expires_at) {
    console.warn(
      `[meta:template] Warning: this token expires at ${new Date(
        data.expires_at * 1000
      ).toISOString()}. Use a permanent system-user token for production.`
    );
  }

  const candidates = new Set();
  for (const entry of data.granular_scopes || []) {
    if (
      ['whatsapp_business_management', 'whatsapp_business_messaging'].includes(
        entry.scope
      )
    ) {
      for (const id of entry.target_ids || []) candidates.add(String(id));
    }
  }

  if (!candidates.size) {
    fail(
      'Could not discover a WhatsApp Business Account from the token. ' +
        'Check that it has whatsapp_business_management and set ' +
        'META_WHATSAPP_BUSINESS_ACCOUNT_ID manually.'
    );
  }

  const working = [];
  for (const id of candidates) {
    try {
      await axios.get(
        `https://graph.facebook.com/${GRAPH_VERSION}/${id}/message_templates`,
        {
          headers,
          params: { limit: 1, fields: 'id' },
          timeout: 15000,
        }
      );
      working.push(id);
    } catch {
      // Not a WABA this token can manage — try the next candidate.
    }
  }

  if (!working.length) {
    fail(
      `The token cannot read templates for the discovered WABA(s): ${[
        ...candidates,
      ].join(', ')}. Check whatsapp_business_management permission.`
    );
  }
  if (working.length > 1) {
    fail(
      `Multiple WhatsApp Business Accounts found (${working.join(
        ', '
      )}). Set META_WHATSAPP_BUSINESS_ACCOUNT_ID explicitly.`
    );
  }

  console.log(
    `[meta:template] Discovered WABA ID ${working[0]} from the access token.`
  );
  return working[0];
}

async function main() {
  if (!TOKEN) {
    fail(
      'META_WHATSAPP_TOKEN is missing. Generate a system-user token with ' +
        'whatsapp_business_management in Meta Business Settings first.'
    );
  }

  const headers = { Authorization: `Bearer ${TOKEN}` };
  const wabaId = WABA_ID || (await discoverWabaId(headers));
  const baseUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/message_templates`;

  console.log(`[meta:template] Checking ${TEMPLATE_NAME} (${TEMPLATE_LANG})...`);

  let existing;
  try {
    const list = await axios.get(baseUrl, {
      headers,
      params: {
        name: TEMPLATE_NAME,
        fields: 'id,name,status,category,language,rejected_reason',
      },
      timeout: 20000,
    });
    existing = (list.data.data || []).find(
      (template) => template.language === TEMPLATE_LANG
    );
  } catch (err) {
    const detail = err.response?.data?.error;
    fail(
      `Could not read templates from WABA ${wabaId}: ` +
        `${detail?.message || err.message}${detail?.code ? ` (code ${detail.code})` : ''}`
    );
  }

  if (existing) {
    console.log('[meta:template] Template already exists — nothing submitted.');
    console.log(
      JSON.stringify(
        {
          id: existing.id,
          name: existing.name,
          language: existing.language,
          category: existing.category,
          status: existing.status,
          rejectedReason: existing.rejected_reason || null,
        },
        null,
        2
      )
    );
    if (existing.status === 'APPROVED') {
      console.log(
        '\n[meta:template] APPROVED. Set META_WHATSAPP_APPROVAL_TEMPLATE and ' +
          'META_WHATSAPP_APPROVAL_TEMPLATE_LANG on the server, then redeploy.'
      );
    } else if (existing.status === 'REJECTED') {
      console.log(
        '\n[meta:template] REJECTED. Open WhatsApp Manager → Message templates, ' +
          'fix the body/buttons per Meta notes, then resubmit.'
      );
    } else {
      console.log(
        '\n[meta:template] Still in review (usually minutes to 24 hours). ' +
          'Check WhatsApp Manager → Message templates.'
      );
    }
    return;
  }

  console.log('[meta:template] Submitting the Utility template...');
  try {
    const created = await axios.post(baseUrl, TEMPLATE_PAYLOAD, {
      headers,
      timeout: 20000,
    });
    console.log('[meta:template] Submitted successfully:');
    console.log(
      JSON.stringify(
        {
          id: created.data?.id,
          status: created.data?.status,
          category: created.data?.category,
        },
        null,
        2
      )
    );
    console.log(
      '\n[meta:template] Meta usually reviews Utility templates within minutes. ' +
        'Approve/check it in WhatsApp Manager → Message templates.'
    );
  } catch (err) {
    const detail = err.response?.data?.error;
    const extra = detail?.error_data?.details
      ? `\n${detail.error_data.details}`
      : '';
    fail(
      `Template creation failed: ${detail?.message || err.message}` +
        `${detail?.code ? ` (code ${detail.code})` : ''}${extra}`
    );
  }
}

main().catch((err) => fail(err.message));
