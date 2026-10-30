/**
 * WhatsApp Provider Abstraction
 * Supports: Baileys (WhatsApp Web, QR login) | Meta Cloud API | Twilio
 *
 * There is NO user-facing "demo mode" any more — the admin Demo/Live toggle was
 * removed. Messages always go out through the configured provider. The one
 * exception is a development fallback (see `isDemo` below): while the provider
 * is NOT yet configured (no linked WhatsApp number / missing credentials) the
 * service simulates sends so the web simulator preview and API testing keep
 * working before a number is linked. In production this fallback never applies.
 *
 * PRODUCTION IS LIVE-ONLY
 *  In NODE_ENV=production the simulation fallback is removed: the mode is always
 *  "live" and demo OTPs are never surfaced.
 */
const config = require('../config');
const baileysService = require('./baileysService');

/** Env values still holding the "PASTE_..._HERE" template count as missing. */
const isRealValue = (value) => Boolean(value) && !/^PASTE_/i.test(String(value));

class WhatsappService {
  constructor() {
    this.provider = config.whatsapp.provider;
    this._capture = null;
  }

  /** Credentials the active provider still needs before it can go live. */
  get missingCredentials() {
    if (!this.provider) return ['WHATSAPP_PROVIDER'];

    if (this.provider === 'meta') {
      const missing = [];
      if (!isRealValue(config.whatsapp.meta.token)) missing.push('META_WHATSAPP_TOKEN');
      if (!isRealValue(config.whatsapp.meta.phoneNumberId)) missing.push('META_WHATSAPP_PHONE_NUMBER_ID');
      return missing;
    }

    if (this.provider === 'twilio') {
      const missing = [];
      if (!isRealValue(config.whatsapp.twilio.accountSid)) missing.push('TWILIO_ACCOUNT_SID');
      if (!isRealValue(config.whatsapp.twilio.authToken)) missing.push('TWILIO_AUTH_TOKEN');
      return missing;
    }

    if (this.provider === 'baileys') {
      // No .env credentials — the channel is authorised by scanning a QR code
      // (Admin → Integrations). The session persists in server/.baileys-auth/.
      return baileysService.hasSession() ? [] : ['WHATSAPP_SESSION (scan the QR in Admin → Integrations)'];
    }

    return [`WHATSAPP_PROVIDER (unsupported value: ${this.provider})`];
  }

  /** True when every credential the provider needs is present. */
  get configured() {
    return this.missingCredentials.length === 0;
  }

  /**
   * True when outgoing messages must be simulated. This is NOT a user-facing
   * "demo mode" — it is a development fallback that only applies while the
   * provider is not yet configured (no linked WhatsApp number / missing creds).
   * Production always reports false (live-only).
   */
  get isDemo() {
    if (config.isProd()) return false; // production: simulation fallback removed, always live
    return !this.configured;
  }

  /** 'demo' (simulating) | 'live' (real sends). Derived — not toggleable. */
  get mode() {
    return this.isDemo ? 'demo' : 'live';
  }

  getStatus() {
    return {
      provider: this.provider || 'demo',
      mode: this.mode,
      isDemo: this.isDemo,
      configured: this.configured,
      missing: this.missingCredentials,
    };
  }

  /**
   * In-memory capture for the web simulator. While active, every outgoing
   * message is recorded so the web chat can render the bot's replies.
   */
  startCapture() {
    this._capture = [];
    return this._capture;
  }

  stopCapture() {
    const captured = this._capture || [];
    this._capture = null;
    return captured;
  }

  async sendMessage(to, text) {
    if (this._capture) {
      this._capture.push({ to, text, at: new Date().toISOString() });
    }

    if (this.isDemo) {
      console.log(`[WhatsApp DEMO] → ${to}: ${text}`);
      return { success: true, demo: true, to, text };
    }

    if (this.provider === 'meta') {
      return this._sendMeta(to, text);
    } else if (this.provider === 'twilio') {
      return this._sendTwilio(to, text);
    } else if (this.provider === 'baileys') {
      return this._sendBaileys(to, text);
    }

    throw new Error(`Unknown WhatsApp provider: ${this.provider}`);
  }

  /**
   * Send a real OTP to a phone number on WhatsApp.
   * - Baileys: freeform text — WhatsApp Web has no template approval step.
   * - Meta Cloud API: uses a pre-approved AUTHENTICATION template (required for
   *   business-initiated messages outside the 24h customer service window).
   * - Twilio: freeform text (works in sandbox; production requires an approved
   *   content template configured on the Twilio side).
   * - Demo: logs + returns demo flag; the caller may surface a demo OTP.
   */
  async sendOtp(to, otp) {
    const text = `[CareConnect] ${otp} is your verification code. It expires in 10 minutes. Do not share it with anyone.`;

    if (this._capture) {
      this._capture.push({ to, text, at: new Date().toISOString() });
    }

    if (this.isDemo) {
      console.log(`[WhatsApp DEMO] OTP → ${to}: ${otp}`);
      return { success: true, demo: true, to };
    }

    if (this.provider === 'meta') {
      return this._postMeta(this.buildMetaOtpPayload(to, otp));
    } else if (this.provider === 'twilio') {
      return this._sendTwilio(to, text);
    } else if (this.provider === 'baileys') {
      return this._sendBaileys(to, text);
    }

    throw new Error(`Unknown WhatsApp provider: ${this.provider}`);
  }

  /**
   * Builds the Meta Cloud API payload for an OTP authentication template.
   * Exposed for testing. Override via config.whatsapp.meta.otpTemplate.
   */
  buildMetaOtpPayload(to, otp, override = {}) {
    const { name, lang, hasButton } = { ...config.whatsapp.meta.otpTemplate, ...override };
    const components = [
      { type: 'body', parameters: [{ type: 'text', text: String(otp) }] },
    ];
    if (hasButton) {
      // Authentication templates with a "Copy code" button require the code
      // to be repeated in the button URL component.
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: String(otp) }],
      });
    }
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name, language: { code: lang }, components },
    };
  }

  async _postMeta(payload) {
    const { token, phoneNumberId } = config.whatsapp.meta;
    if (!token || !phoneNumberId) {
      throw new Error('Meta WhatsApp token or phoneNumberId not configured.');
    }

    // Meta expects E.164 without a leading "+".
    const body = { ...payload, to: String(payload.to || '').replace(/^\+/, '') };

    const axios = require('axios');
    try {
      const resp = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      return { success: true, messageId: resp.data?.messages?.[0]?.id };
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.message;
      console.error('[WhatsApp Meta] Send failed:', detail);
      const error = new Error(`WhatsApp message delivery failed: ${detail}`);
      error.statusCode = 502;
      throw error;
    }
  }

  async _sendMeta(to, text) {
    return this._postMeta({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    });
  }

  /** Freeform send through the linked WhatsApp number (Baileys / WhatsApp Web). */
  async _sendBaileys(to, text) {
    return baileysService.sendText(to, text);
  }

  async _sendTwilio(to, text) {
    const { accountSid, authToken, from } = config.whatsapp.twilio;
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured.');
    }

    const twilio = require('twilio')(accountSid, authToken);
    try {
      const msg = await twilio.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${to}`,
        body: text,
      });
      return { success: true, messageId: msg.sid };
    } catch (err) {
      console.error('[WhatsApp Twilio] Send failed:', err.message);
      throw new Error('WhatsApp message delivery failed.');
    }
  }

  /**
   * Verify Meta webhook signature.
   * Returns true if valid or if in demo mode.
   */
  verifyMetaSignature(rawBody, signature) {
    if (this.isDemo) return true;
    if (!signature) return false;

    const crypto = require('crypto');
    const { appSecret } = config.whatsapp.meta;
    if (!appSecret) return false;

    const expected = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    return `sha256=${expected}` === signature;
  }
}

module.exports = new WhatsappService();

