/**
 * WhatsApp Provider Abstraction
 * Supports: Meta Cloud API | Twilio | Demo Mode
 */
const config = require('../config');

class WhatsappService {
  constructor() {
    this.provider = config.whatsapp.provider;
    this.isDemo = !this.provider;
    this._capture = null;
  }

  getStatus() {
    return {
      provider: this.provider || 'demo',
      isDemo: this.isDemo,
      configured: !this.isDemo,
    };
  }

  /**
   * In-memory capture for the web simulator (demo only).
   * While active, every outgoing message is recorded AND still processed normally.
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
    }

    throw new Error(`Unknown WhatsApp provider: ${this.provider}`);
  }

  /**
   * Send a real OTP to a phone number on WhatsApp.
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

    const axios = require('axios');
    try {
      const resp = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        payload,
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

