# CareConnect — WhatsApp-Based Smart Elderly Care & Healthcare Coordination Platform

A full-stack web application that helps elderly parents living independently while their children study or work in other cities. Parents use WhatsApp. Children use a dashboard. Workers use a provider portal. All three share one secure backend.

## Architecture

```
careconnect/
├── client/          # React + Vite + Tailwind frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route pages (public, auth, child, parent, provider, admin)
│       ├── layouts/      # Dashboard layout
│       ├── context/      # Auth context
│       ├── services/     # API client
│       └── utils/        # Helpers
├── server/          # Node.js + Express + MongoDB backend
│   └── src/
│       ├── config/       # App config, database
│       ├── models/       # Mongoose schemas
│       ├── routes/       # Express routers
│       ├── controllers/  # Route handlers
│       ├── services/     # WhatsApp, AI, business logic
│       ├── middleware/   # Auth, validation, error handling
│       ├── jobs/         # Background schedulers
│       └── utils/        # Seed script, helpers
├── docker-compose.yml
├── Dockerfile.server
├── Dockerfile.client
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
# Edit .env — at minimum set MONGODB_URI and JWT_SECRET
```

### 3. Seed demo data (optional)

```bash
cd server
npm run seed
```

This creates clearly fictional demo accounts:
| Role | Email | Password |
|------|-------|----------|
| Parent | parent@demo.careconnect | Demo@1234 |
| Child | child@demo.careconnect | Demo@1234 |
| Provider | provider@demo.careconnect | Demo@1234 |
| Admin | admin@demo.careconnect | Demo@1234 |

### 4. Start development servers

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open http://localhost:5173

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Tailwind CSS, Lucide icons |
| Backend | Node.js, Express, JWT auth, express-validator |
| Database | MongoDB, Mongoose |
| WhatsApp | Meta Cloud API / Twilio (provider abstraction) |
| AI | OpenAI / Google Gemini (with deterministic fallback) |
| Styling | Tailwind CSS with custom healthcare design system |

## Integration Modes

| Integration | Unconfigured (default) | Configured / Live |
|-------------|-------------------|-----------|
| Database | Local MongoDB | MongoDB Atlas |
| WhatsApp | Simulated (until a number is linked) | Baileys (QR), Meta Cloud API or Twilio |
| AI Intent | Deterministic keyword matching | OpenAI or Google Gemini |
| Maps | Unavailable | Google Maps API |
| Rides | Manual fulfillment | Configured ride provider |
| Food | Demo catalogue | Configured food provider |
| Household | Fictional demo providers | Verified provider network |
| Email | Simulated | SMTP |

All demo/simulated features are clearly labelled in the UI and API responses.

## Family Approval Automation

Parent requests are no longer ordered blindly. The WhatsApp pipeline parses the
intent, then asks a linked child to approve before anything is placed:

1. Parent sends a request on WhatsApp (food, ride, home service, daily items or
   medicines).
2. CareConnect creates an `ApprovalRequest` and sends the child an Approve /
   Decline prompt on WhatsApp, plus an in-app notification.
3. The first child response wins (atomic `pending → processing` claim) and must
   come from an active `FamilyLink`.
4. **Approve** → CareConnect places the order/booking, then sends the parent the
   delivery partner's name, phone, ETA and a 4-digit delivery OTP on WhatsApp.
   A secure delivery-partner handoff link is issued too; the rider opens it,
   enters the OTP at handover, and the order is marked complete on verification.
   Grocery and medicine approvals send provider hand-off links instead of an OTP.
5. **Decline** → no order is placed; the parent is told that their family will
   help. Requests expire after `APPROVAL_EXPIRES_MINUTES` (default 15).

Children can also approve from the dashboard at `/approvals` (a fallback when
WhatsApp buttons are unavailable). Text replies `APPROVE <code>` and
`DECLINE <code>` always work. Approved requests expose a **Get delivery link**
action that rotates and copies the rider handoff URL.

### Delivery OTP verification

- Handoff URL: `/delivery/<token>` (mobile page, no login for the rider).
- Token: 32 random bytes, stored only as a SHA-256 hash; 24-hour expiry.
- OTP: 4 digits, stored only as a SHA-256 hash; 24-hour expiry.
- Wrong OTP: 5 attempts, then a 15-minute lock (configurable).
- On success the linked `FoodOrder` / `RideRequest` / `ServiceBooking` becomes
  `delivered` / `completed`, the family gets an in-app notification and the
  parent gets a WhatsApp confirmation.
- Public API: `GET /api/delivery/handoff/:token` and
  `POST /api/delivery/handoff/:token/verify` with `{ "otp": "1234" }`.
  Authenticated family members can rotate the link with
  `POST /api/approvals/:id/handoff`.

**Production note:** Meta Cloud API only allows free-form interactive buttons
inside an open 24-hour customer-service window. Child approval prompts therefore
use the approved Utility template `careconnect_approval_request` (configure it
with `META_WHATSAPP_APPROVAL_TEMPLATE`; exact template body and JSON payload are
in [`WHATSAPP_SETUP.md`](WHATSAPP_SETUP.md#meta-utility-template-for-child-approval)).
If the template is not configured, CareConnect falls back to interactive buttons
and then text commands. Baileys sends buttons without template approval; Twilio
falls back to text commands automatically.

## Security Features

- Bcrypt password hashing (10+ rounds)
- JWT authentication with httpOnly cookies
- Server-side role-based authorization (parent, child, provider, admin)
- Family data isolation — users cannot access other families' data
- Webhook signature verification (Meta)
- Rate limiting (100 requests / 15 minutes)
- Request validation with express-validator
- Helmet security headers
- CORS restricted to configured client URL
- Audit logging for sensitive operations
- No secrets exposed in frontend or API responses

## API Documentation

See [API.md](./API.md) for the complete REST API reference.

## Deployment

### Docker

```bash
docker-compose up -d
```

### Manual Deployment

1. Build client: `cd client && npm run build`
2. Serve `client/dist` via nginx or any static host
3. Start server: `cd server && npm start` (set `NODE_ENV=production`)
4. Use MongoDB Atlas for the database
5. Configure HTTPS via reverse proxy (nginx/Caddy)
6. Set strong `JWT_SECRET` and all integration credentials

### Environment Variables

Copy `server/.env.example` to `server/.env` and fill in values. See comments in the example file for each variable.

## Medical Disclaimer

CareConnect does **not**:
- Diagnose illnesses or medical conditions
- Prescribe treatments or medication dosages
- Replace professional medical care
- Dispatch emergency services (call 112 for emergencies)

CareConnect **does**:
- Send medication reminders and track acknowledgement
- Coordinate wellness check-ins
- Facilitate ride booking for medical appointments
- Notify family members of missed check-ins or emergencies
- Coordinate household services

## Testing

```bash
cd server && npm test
```

## License

ISC
