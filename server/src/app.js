require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const config = require('./config');
const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const familyRoutes = require('./routes/family');
const reminderRoutes = require('./routes/reminders');
const serviceRoutes = require('./routes/services');
const providerRoutes = require('./routes/provider');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');
const emergencyRoutes = require('./routes/emergency');
const notificationRoutes = require('./routes/notifications');
const wellnessRoutes = require('./routes/wellness');
const simulatorRoutes = require('./routes/simulator');

const app = express();

// Behind a reverse proxy (Render/Heroku/nginx) — needed for correct client IPs
// in rate limiting and secure cookies.
if (!config.isDev()) app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Parsing ───────────────────────────────────────────────────────────────────
// NOTE: Webhook route handles raw body itself; keep JSON parser after webhook mount
app.use(cookieParser());
app.use(morgan(config.isDev() ? 'dev' : 'combined'));

// Webhook must come before JSON middleware (uses raw body)
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString(), env: config.env });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/simulator', simulatorRoutes);

// ── Not found ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  const { startJobs } = require('./jobs/scheduler');
  startJobs();

  const wa = require('./services/whatsappService').getStatus();
  let waLabel = wa.configured
    ? `LIVE (${wa.provider})`
    : `NOT LINKED${wa.missing.length ? ` — missing ${wa.missing.join(', ')}` : ''}`;

  // Baileys (WhatsApp Web): pair a normal WhatsApp number by scanning a QR.
  if (config.whatsapp.provider === 'baileys') {
    const baileys = require('./services/baileysService');
    const webhookController = require('./controllers/webhookController');
    baileys.setInboundHandler(webhookController.handleIncomingMessage);
    baileys
      .connect()
      .then((s) => {
        console.log(
          `[Server] WhatsApp (Baileys): ${s.state}` +
            (s.state === 'open'
              ? ` as ${s.phone || 'unknown number'}`
              : ' — scan the QR in Admin → Integrations to link a number')
        );
      })
      .catch((err) => console.error('[Server] WhatsApp (Baileys) failed to start:', err.message));
    waLabel = `${wa.mode.toUpperCase()} (baileys${wa.configured ? '' : ' — QR scan pending'})`;
  }

  app.listen(config.port, () => {
    console.log(`[Server] CareConnect backend running on port ${config.port} [${config.env}]`);
    console.log(`[Server] WhatsApp: ${waLabel}`);
    console.log(`[Server] AI: ${config.ai.provider || 'Deterministic fallback'}`);
  });
};

if (require.main === module) {
  start().catch((err) => {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  });
}

module.exports = { app, start };
