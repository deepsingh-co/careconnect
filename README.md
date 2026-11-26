# CareConnect — WhatsApp-Based Smart Elderly Care & Healthcare Coordination Platform

A full-stack web application that helps elderly parents living independently while their children study or work in other cities. Parents use WhatsApp. Children use a dashboard. Workers use a provider portal. All three share one secure backend.

## Features

**Parents (WhatsApp-first)**
- Ask in Hinglish, Hindi or English: food, rides, home services, daily items and medicines.
- Family approval before spending, with delivery partner details and a 4-digit OTP on WhatsApp.
- Daily items can be auto-approved and are compared across Blinkit, Zepto and Instamart so the cheapest option is picked automatically.

**Children (dashboard)**
- Approve or decline requests from `/approvals`, or directly from the buttons on an in-app notification.
- Per-parent, per-category auto-approve toggles (daily items ON by default, everything else opt-in).
- Grocery price-comparison card showing each provider's total, ETA and the cheapest order link.
- Medicine reminders, wellness check-ins, emergency alerts, bookings and the family audit trail.

**Providers and admins**
- Provider portal for job accept/reject and status updates.
- Admin console for users, provider verification, integration health, audit logs and the WhatsApp QR pairing console.

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
intent, then either auto-approves (when the child enabled that category) or asks
a linked child to approve before anything is placed:

1. Parent sends a request on WhatsApp (food, ride, home service, daily items or
   medicines).
2. CareConnect creates an `ApprovalRequest` and sends the child an Approve /
   Decline prompt on WhatsApp, plus an in-app notification with the same buttons.
3. **Auto-approve** — if an actively linked child has that category switched ON,
   the request is approved immediately (atomic claim) and the child is told it
   needed no action. This applies per parent *and* per category.
   - Daily items (`grocery`) default to **ON**; food, ride, home service and
     medicine default to **OFF**.
   - Children change their own settings at `/approvals` (or
     `PATCH /api/family/links/:linkId/auto-approve`). Parents cannot opt a child
     into spending approvals. `manageBookings: false` disables auto-approval.
   - Only the first child with the category ON is used; the audit trail records
     `approval.auto_approved`.
4. Otherwise the first child response wins (atomic `pending → processing` claim)
   and must come from an active `FamilyLink`.
5. **Approve** → CareConnect places the order/booking, then sends the parent the
   delivery partner's name, phone, ETA and a 4-digit delivery OTP on WhatsApp.
   A secure delivery-partner handoff link is issued too; the rider opens it,
   enters the OTP at handover, and the order is marked complete on verification.
   Grocery and medicine approvals send provider hand-off links instead of an OTP.
6. **Decline** → no order is placed; the parent is told that their family will
   help. Requests expire after `APPROVAL_EXPIRES_MINUTES` (default 15).

Children can also approve from `/approvals` or straight from the **Approve /
Decline** buttons on an in-app notification. Notifications are marked handled as
soon as any linked child decides, so stale buttons disappear everywhere. Text
replies `APPROVE <code>` and `DECLINE <code>` always work. Approved requests
expose a **Get delivery link** action that rotates and copies the rider handoff
URL.

### Daily items: cheapest quick-commerce option

Blinkit, Zepto and Swiggy Instamart do not publish public consumer cart APIs.
CareConnect therefore compares clearly-labelled **deterministic demo estimates**
(stable prices, delivery + handling fees, ETA), picks the lowest total, and sends
the parent the cheapest provider's prefilled search page plus the other options.
The `priceComparison` object stored on the approval (and shown in the UI) carries
`isEstimate: true`; the provider app always shows the real bill at checkout.
Auto-approved daily items use the same comparison. No automatic payment or
provider-side order is claimed.

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
After adding a valid `META_WHATSAPP_TOKEN`, run `cd server && npm run meta:template`
to submit the template automatically.
If the template is not configured, CareConnect falls back to interactive buttons
and then text commands. Baileys sends buttons without template approval; Twilio
falls back to text commands automatically.

## Admin Console

- `/admin` — platform stats, live integration health and shortcuts.
- `/admin/whatsapp` — dedicated WhatsApp console: link state, QR pairing,
  re-link, disconnect, test send, demo checklist and copy-ready parent messages.
- `/admin/integrations` — full integration matrix (database, AI, maps, email,
  providers) with setup hints.
- `/admin/users`, `/admin/providers`, `/admin/audit` — user management, provider
  verification and the audit trail. WhatsApp restart/disconnect/test-send
  actions are written to the audit log.

### Demo runbook (WhatsApp)

1. Open **Admin → WhatsApp** and confirm the provider is `baileys`.
2. Scan the QR with a **dedicated** number (never a personal number).
3. Send a test message from the page.
4. From the parent phone send `dudh aur poha chahiye` — daily items are
   auto-approved by default, so no child tap is needed. The parent receives the
   Blinkit / Zepto / Instamart comparison and the cheapest order link.
5. Open `/approvals` as the demo child and show the per-category toggles plus the
   price-comparison card on the auto-approved request.
6. From the parent phone send `khana chahiye` — the child gets a WhatsApp prompt
   and an in-app notification. Approve it from either place; the parent receives
   the delivery partner, ETA, delivery OTP and the rider handoff link.
7. Open the handoff link, enter the OTP and show the delivery being verified.

Prices shown for quick-commerce are clearly labelled demo estimates; the
provider app shows the final bill at checkout.

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
# Backend API suite (Jest + test MongoDB)
cd server && npm test

# Frontend production build and lint
cd client && npm run build
cd client && npm run lint
```

The backend suite covers authentication and role isolation, family approvals and
auto-approval, quick-commerce price comparison, delivery OTP verification,
WhatsApp webhook/simulator flows and the Baileys channel. The client build must
pass; lint currently reports only pre-existing warnings.

## License

ISC
