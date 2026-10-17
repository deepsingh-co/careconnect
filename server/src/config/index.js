require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/careconnect',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
  },

  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || '', // 'meta' | 'twilio' | ''
    meta: {
      token: process.env.META_WHATSAPP_TOKEN || '',
      phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || '',
      webhookVerifyToken: process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'dev_verify_token',
      appSecret: process.env.META_WHATSAPP_APP_SECRET || '',
      otpTemplate: {
        // Pre-approved Meta Authentication template used to deliver OTPs.
        // Business-initiated messages (like OTPs) REQUIRE a template on the
        // Cloud API — freeform text is only allowed inside a 24h user window.
        name: process.env.META_WHATSAPP_OTP_TEMPLATE || 'otp_verification',
        lang: process.env.META_WHATSAPP_OTP_TEMPLATE_LANG || 'en_US',
        hasButton: process.env.META_WHATSAPP_OTP_TEMPLATE_BUTTON === 'true',
      },
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      from: process.env.TWILIO_WHATSAPP_FROM || '+14155238886',
    },
  },

  ai: {
    provider: process.env.AI_PROVIDER || '', // 'openai' | 'google' | ''
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
      model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
    },
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || '',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@careconnect.health',
  },

  maps: {
    provider: process.env.MAPS_PROVIDER || '',
    googleApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  isDev() {
    return this.env === 'development';
  },

  isProd() {
    return this.env === 'production';
  },
};

module.exports = config;
