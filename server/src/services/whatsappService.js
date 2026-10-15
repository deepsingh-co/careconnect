/**
 * WhatsApp Provider Abstraction
 * Supports: Meta Cloud API | Twilio | Demo Mode
 */
const config = require('../config');

class WhatsappService {
  constructor() {
    this.provider = config.whatsapp.provider;
    this.isDemo = !this.provider;
  }

  getStatus() {
    return {
      provider: this.provider || 'demo',
      isDemo: this.isDemo,
      configured: !this.isDemo,
    };
  }

  async sendMessage(to, text) {
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

  async _sendMeta(to, text) {
    const { token, phoneNumberId } = config.whatsapp.meta;
    if (!token || !phoneNumberId) {
      throw new Error('Meta WhatsApp token or phoneNumberId not configured.');
    }

    const axios = require('axios');
    try {
      const resp = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { success: true, messageId: resp.data?.messages?.[0]?.id };
    } catch (err) {
      console.error('[WhatsApp Meta] Send failed:', err.response?.data || err.message);
      throw new Error('WhatsApp message delivery failed.');
    }
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

