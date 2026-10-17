# CareConnect — Real WhatsApp Setup (Production Guide)

CareConnect works in three WhatsApp modes:

| Mode | `WHATSAPP_PROVIDER` | What happens |
|------|--------------------|--------------|
| Demo | *(empty)* | Nothing is sent on WhatsApp. Replies are logged; the web chat simulator + demo OTP display are enabled. |
| Meta Cloud API | `meta` | **Real** messages and **real OTPs** sent from your WhatsApp Business number via the official Meta Cloud API (free tier available). |
| Twilio | `twilio` | Real messages via Twilio WhatsApp (sandbox for instant testing). |

Everything in the app already uses one abstraction (`server/src/services/whatsappService.js`) — switching to real WhatsApp is **configuration only, no code changes**.

---

## Option A — Meta WhatsApp Cloud API (recommended, official)

### 1. Create the app and get credentials

1. Go to https://developers.facebook.com → **My Apps → Create App** → type **Business**.
2. Add the **WhatsApp** product. You get a free **test number** — you can message up to 5 verified recipients without any business verification.
3. From **WhatsApp → API Setup** copy:
   - **Phone number ID** → `META_WHATSAPP_PHONE_NUMBER_ID`
   - **Temporary access token** → `META_WHATSAPP_TOKEN` (expires in 24h — use for testing only)
4. From **App Settings → Basic** copy the **App Secret** → `META_WHATSAPP_APP_SECRET` (used to verify incoming webhook signatures).
5. For production, generate a **permanent token**: https://business.facebook.com → Settings → **System Users** → new system user → assign the app + WhatsApp asset → generate token with `whatsapp_business_messaging` permission.

### 2. Deploy the backend with a public HTTPS URL (required)

Meta needs to reach your webhook. Deploy with the included Render blueprint (see "Deploy" below), then check:

```
https://<your-api-domain>/api/health   →  { "success": true, ... }
```

### 3. Configure the webhook

Meta App → **WhatsApp → Configuration → Webhook → Edit**:

- **Callback URL:** `https://<your-api-domain>/api/webhooks/whatsapp`
- **Verify token:** exactly the value of `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Click Verify and Save (the server answers the Meta challenge automatically)
- Under **Webhook fields**, subscribe to **messages**

### 4. Create the OTP template (required for real OTPs)

WhatsApp only allows **pre-approved templates** for business-initiated messages like OTPs. Freeform text is allowed only within 24 hours after the user messaged you.

1. Open **WhatsApp Manager → Account tools → Message templates → Create template**
2. Category: **Authentication**
3. Name: `otp_verification` (or your own — then set `META_WHATSAPP_OTP_TEMPLATE`)
4. Language: **English (US)** → `en_US` (add more languages if you like, then set `META_WHATSAPP_OTP_TEMPLATE_LANG`)
5. Body example: `{{1}} is your CareConnect verification code. For your security, do not share this code.`
6. Keep the default **Copy code** button (this is what authentication templates use)
7. If your approved template includes the copy-code button → set `META_WHATSAPP_OTP_TEMPLATE_BUTTON=true`
8. Wait for approval (usually minutes for authentication templates)

### 5. Environment variables

```env
WHATSAPP_PROVIDER=meta
META_WHATSAPP_TOKEN=EAAG...            # permanent system-user token in production
META_WHATSAPP_PHONE_NUMBER_ID=123456789012345
META_WHATSAPP_WEBHOOK_VERIFY_TOKEN=<random long string>
META_WHATSAPP_APP_SECRET=<app secret>
META_WHATSAPP_OTP_TEMPLATE=otp_verification
META_WHATSAPP_OTP_TEMPLATE_LANG=en_US
META_WHATSAPP_OTP_TEMPLATE_BUTTON=true
```

### 6. End-to-end test checklist

- [ ] `GET /api/health` OK on the public URL
- [ ] Meta webhook shows **Verified** and `messages` subscribed
- [ ] Add your own phone under **API Setup → To** (test recipients)
- [ ] Register a child account → **Family → Add Parent Details** → enter your phone → **real OTP arrives on WhatsApp**
- [ ] Reply to the OTP, verify the parent gets linked & the welcome message arrives
- [ ] From the parent's WhatsApp, send `khana chahiye` / `ride chahiye` → real replies
- [ ] Reminders fire on schedule (see note below)

### Going live (production checklist)

- Complete **Business Verification** and add a payment method (WhatsApp pricing is per conversation; service conversations have a free monthly tier).
- Replace the temporary token with a permanent system-user token.
- Note the **24-hour customer service window**: freeform replies (the bot chat, confirmations) only work within 24h of the user's last message — which is fine for a chat bot. Reminders sent later may need an approved **Utility** template; the scheduler marks failed deliveries in the DB and keeps running.

---

## Option B — Twilio (fastest way to test instantly, no business account)

1. Create a free account at https://twilio.com → **Messaging → Try it out → Send a WhatsApp message** (Sandbox).
2. From your phone, send `join <your-sandbox-code>` to the sandbox number shown (e.g. `+1 415 523 8886`).
3. Set env:

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=+14155238886
```

4. Webhook: in the Twilio sandbox settings, set **"When a message comes in"** to `https://<your-api-domain>/api/webhooks/whatsapp` (form-encoded payloads are handled automatically).
5. OTPs are delivered as freeform messages in the sandbox — instantly usable.
6. Production on Twilio: register a WhatsApp sender; business-initiated OTPs require an approved Content template.

---

## Deploy (Render + MongoDB Atlas)

### 1. Database — MongoDB Atlas (free M0)

1. https://cloud.mongodb.com → create a free **M0** cluster
2. Database Access → add a user (password)
3. Network Access → allow `0.0.0.0/0` (or restrict to Render egress IPs)
4. Copy the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/careconnect`

### 2. Render Blueprint

1. Push this repo to GitHub
2. https://render.com → **New → Blueprint** → select the repo → Apply
   (creates `careconnect-api` web service + `careconnect-web` static site from `render.yaml`)
3. Fill the marked (`sync: false`) env vars:
   - API: `MONGODB_URI`, `CLIENT_URL`, `META_*`
   - Web: `VITE_API_URL=https://<api-service>.onrender.com/api`
4. Set `CLIENT_URL` to the web URL (e.g. `https://careconnect-web.onrender.com`) so CORS allows it, then redeploy the API
5. Optional: run the demo seed once from the Render shell: `npm run seed`

### Environment quick reference

| Variable | Example | Notes |
|----------|---------|-------|
| `WHATSAPP_PROVIDER` | `meta` | empty = demo mode |
| `META_WHATSAPP_TOKEN` | `EAAG...` | permanent system-user token |
| `META_WHATSAPP_PHONE_NUMBER_ID` | `123456789012345` | API Setup |
| `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN` | random string | same value in Meta webhook config |
| `META_WHATSAPP_APP_SECRET` | app secret | webhook signature verification |
| `META_WHATSAPP_OTP_TEMPLATE` | `otp_verification` | approved auth template name |
| `META_WHATSAPP_OTP_TEMPLATE_LANG` | `en_US` | template language code |
| `META_WHATSAPP_OTP_TEMPLATE_BUTTON` | `true` | if template has copy-code button |
| `CLIENT_URL` | `https://...` | CORS origin for the web app |
| `VITE_API_URL` | `https://.../api` | build-time var for the client |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Webhook verification fails | Verify token mismatch, or the URL is not public HTTPS |
| OTP request returns 502 | Check server logs — usually invalid/expired token, wrong phone number ID, or template not approved |
| `#131047` re-engagement error | Business-initiated message outside 24h window — must use an approved template |
| `#132001` template does not exist | Template not approved yet, or name/language mismatch with env vars |
| OTP arrives but Verify fails | Parent entered the code after 10 min expiry or exceeded 5 attempts → request a new OTP |
| Messages sent but not received | Recipient not added under test recipients (test mode), or user blocked the number |
