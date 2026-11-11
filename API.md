# CareConnect API Documentation

Base URL: `http://localhost:5000/api`

All responses follow the format:
```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": { ... }
}
```

Authentication uses JWT via `Authorization: Bearer <token>` header or httpOnly cookie.

---

## Authentication

### POST /api/auth/register
Register a new user.

**Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)",
  "role": "parent | child | provider",
  "phone": "string (optional, E.164 format)"
}
```

**Response:** `201` — Returns user object and JWT token.

### POST /api/auth/login
**Body:** `{ "email": "string", "password": "string" }`
**Response:** `200` — Returns user object and JWT token.

### POST /api/auth/logout
**Response:** `200` — Clears auth cookie.

### GET /api/auth/me
**Response:** `200` — Returns current user (requires authentication).

### PATCH /api/auth/profile
**Body:** `{ "name": "...", "phone": "...", "preferredLanguage": "en|hi|hinglish" }`
**Response:** `200` — Returns updated user.

---

## Family

### GET /api/family
Returns family links for the authenticated user.

### POST /api/family/invitations
Creates an invitation code (parent only).
**Response:** `{ "code": "ABC123", "expiresAt": "..." }`

### POST /api/family/invitations/accept
**Body:** `{ "code": "ABC123" }`
Accepts an invitation and activates the family link.

### PATCH /api/family/consent
**Body:** `{ "linkId": "...", "permissions": { "viewMedications": true, ... } }`
Updates consent permissions (parent only).

---

## Reminders

### GET /api/reminders
Returns medicine reminders for the parent.

### POST /api/reminders
**Body:**
```json
{
  "medicineName": "string",
  "instructions": "string",
  "schedule": [{ "time": "08:30", "label": "Morning" }],
  "recurrence": "daily|weekly|custom",
  "timezone": "Asia/Kolkata"
}
```

### PATCH /api/reminders/:id
Update a reminder (isActive, schedule, etc.).

### POST /api/reminders/events/:eventId/acknowledge
**Body:** `{ "acknowledgement": "taken|remind_later|need_help" }`

### GET /api/reminders/history
Returns reminder event history with pagination.

---

## Services (Bookings, Rides, Food)

### GET /api/services/categories
Returns available service categories.

### GET /api/services/providers?service=home_cleaning
Returns approved providers.

### POST /api/services/bookings
**Body:**
```json
{
  "serviceCategory": "home_cleaning",
  "description": "string",
  "scheduledAt": "ISO date",
  "durationHours": 2,
  "serviceType": "one_time|hourly|recurring",
  "serviceAddress": { "line1": "...", "city": "...", "pincode": "..." }
}
```

### GET /api/services/bookings?status=accepted&category=home_cleaning&page=1&limit=20

### GET /api/services/bookings/:id

### PATCH /api/services/bookings/:id/status
**Body:** `{ "status": "in_progress|completed", "notes": "..." }`

### POST /api/services/bookings/:id/cancel
**Body:** `{ "reason": "..." }`

### POST /api/services/rides
**Body:**
```json
{
  "pickup": { "address": "..." },
  "destination": { "address": "..." },
  "scheduledAt": "ISO date",
  "specialInstructions": "..."
}
```

### GET /api/services/rides

### GET /api/services/menu
Returns demo food catalogue.

### POST /api/services/orders
**Body:**
```json
{
  "items": [{ "itemId": "...", "name": "...", "quantity": 2, "unitPrice": 100 }],
  "deliveryAddress": { "line1": "..." },
  "estimatedTotal": 200
}
```

### GET /api/services/orders

---

## Family Approvals

WhatsApp requests from a parent are placed only after a linked child approves.

### GET /api/approvals?status=pending&limit=50

Parents see their own requests, children see requests for linked parents, admins
see all. The delivery OTP is never returned — only its hash is stored.

### GET /api/approvals/:id

### POST /api/approvals/:id/respond
**Body:** `{ "action": "approve|decline", "reason": "optional" }`

Only an active linked child can respond. The first response wins; a second
response returns `409`. Approving places the order and sends the parent the
delivery partner details + delivery OTP on WhatsApp. The response also contains
`handoffUrl` (returned once) for the delivery partner.

### POST /api/approvals/:id/handoff

Rotate and return a fresh delivery-partner handoff link:
`{ "handoffUrl": "https://.../delivery/<token>", "expiresAt": "..." }`.
Available to the parent, an actively linked child, or an admin. Only for
approved requests that have a delivery OTP (food, ride, home service).

---

## Delivery Handoff (public)

The handoff token is the credential. Only its SHA-256 hash is stored, and the
public routes are rate-limited.

### GET /api/delivery/handoff/:token

Returns the job sheet for the delivery partner: parent name/phone, order summary,
items/route, assigned partner, OTP expiry, verification state. Does not expose
the OTP hash or handoff-token hash.

### POST /api/delivery/handoff/:token/verify
**Body:** `{ "otp": "1234" }`

- Wrong OTP → `400` with remaining attempts; 5 wrong attempts → `429` + 15-min lock.
- Correct OTP → marks `deliveryVerifiedAt`, burns the OTP hash, completes the
  linked `FoodOrder` (`delivered`) / `RideRequest` (`completed`) /
  `ServiceBooking` (`completed`), notifies the family and returns
  `{ "verified": true }`.
- Re-verifying the same delivery is idempotent (`alreadyVerified: true`).
- Invalid token → `404`; expired link/OTP → `410`; unapproved request → `409`.

---

## Notifications

### GET /api/notifications?unread=true&page=1&limit=30

### PATCH /api/notifications/:id/read

### POST /api/notifications/mark-all-read

---

## Emergency

### POST /api/emergency/alerts
**Body:** `{ "assistanceType": "medical|fall|fire|other", "message": "...", "triggeredBy": "dashboard" }`

### GET /api/emergency/alerts?status=active

### PATCH /api/emergency/alerts/:id/acknowledge
**Body:** `{ "resolution": "acknowledged|resolved", "notes": "..." }`

---

## WhatsApp Webhook

### GET /api/webhooks/whatsapp
Meta webhook verification endpoint.

### POST /api/webhooks/whatsapp
Incoming message handler. Processes intents, updates conversation state, and triggers actions.

---

## Provider

All provider endpoints require `provider` or `admin` role.

### GET /api/provider/profile
### PATCH /api/provider/profile
**Body:** `{ "businessName": "...", "services": [...], "pricing": {...}, "serviceArea": {...} }`

### GET /api/provider/jobs?status=requested
### POST /api/provider/jobs/:id/accept
### POST /api/provider/jobs/:id/reject
### PATCH /api/provider/jobs/:id/status
**Body:** `{ "status": "in_progress|completed" }`

---

## Admin

All admin endpoints require `admin` role.

### GET /api/admin/users?role=parent&page=1&limit=20
### PATCH /api/admin/users/:id/toggle
### GET /api/admin/providers/pending
### PATCH /api/admin/providers/:id/review
**Body:** `{ "decision": "approved|rejected", "notes": "..." }`
### GET /api/admin/stats
### GET /api/admin/integrations
### GET /api/admin/audit-logs

---

## Health

### GET /api/health
Returns server health status.

---

## Booking Status Flow

```
draft → awaiting_confirmation → requested → accepted → in_progress → completed
                                        ↘ cancelled
                                        ↘ failed
```

## Provider Job Flow

```
requested → accepted → in_progress → completed
         ↘ (back to requested on reject)
```
