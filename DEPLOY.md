# TicketHub Deployment Guide

## Vercel (serverless Next.js)

### 1. Import the repo
- Log in to Vercel → Add New Project → Import `https://github.com/MathewKioko/TicketHub`
- Framework preset: **Next.js**
- Build command: `npm run build` (auto-detected)
- Output directory: `.next` (auto-detected)
- Install command: `npm install` (auto-detected)

### 2. Environment variables
Add these in **Project Settings → Environment Variables** (Production). Copy from `.env.example` and replace placeholder values with real ones.

Required / recommended:

| Variable | Value (example) | Notes |
|---|---|---|
| `DATABASE_URL` | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/tickethub?retryWrites=true&w=majority` | MongoDB replica set required for Prisma transactions |
| `JWT_SECRET` | `<long random string>` | Custom JWT auth (TicketHub does NOT use next-auth) |
| `ADMIN_SECRET_KEY` | `<long random string>` | Used by `POST /api/admin/set-admin` to create the first admin |
| `APP_NAME` | `tickethub` | Shown in Paystack metadata |
| `INTERNAL_WEBHOOK_SECRET` | `<secret>` | Authenticates forwarded webhooks |
| `NEXT_PUBLIC_APP_URL` | `https://tickethub.vercel.app` | Your Vercel production URL (no trailing slash) |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_...` | From Paystack Dashboard → Developer settings |
| `PAYSTACK_SECRET_KEY` | `sk_live_...` | From Paystack Dashboard |
| `PAYSTACK_BASE_URL` | `https://api.paystack.co` | |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Optional — Stripe integration |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Optional — Stripe webhook signing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Optional — Stripe frontend key |
| `MPESA_ENVIRONMENT` | `production` | `production` or `sandbox` |
| `MPESA_CONSUMER_KEY` | `...` | Safaricom developer credentials |
| `MPESA_CONSUMER_SECRET` | `...` | Safaricom developer credentials |
| `MPESA_SHORTCODE` | `...` | Safaricom paybill/till number |
| `MPESA_PASSKEY` | `...` | Safaricom M-Pesa passkey |
| `MPESA_CALLBACK_URL` | `https://tickethub.vercel.app/api/mpesa/callback` | Must be HTTPS; set on Safaricom dashboard |
| `USD_TO_KES_RATE` | `150` | USD→KES conversion for non-KES tickets |
| `REDIS_URL` | `redis://...` | Optional — app falls back to no-cache if unset |

### 3. MongoDB replica set
Prisma v5 with MongoDB requires a replica set for write transactions. On MongoDB Atlas, enable replica sets on your cluster (free tier supports this).

### 4. Webhook configuration
Configure these callbacks in your payment provider dashboards, pointing to your Vercel domain:

- **Paystack webhook**: `https://tickethub.vercel.app/api/paystack/webhook`
- **M-Pesa callback**: `https://tickethub.vercel.app/api/mpesa/callback` (must match `MPESA_CALLBACK_URL`)
- **Stripe webhook**: `https://tickethub.vercel.app/api/stripe/webhook`

### 5. Bootstrap the first admin
After deploying, create your admin account:

```bash
curl -X POST https://tickethub.vercel.app/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tickethub.test","password":"<strong-password>"}' \
  -H "X-Admin-Secret: <ADMIN_SECRET_KEY>"
```

`ADMIN_SECRET_KEY` must match the env var you set in Vercel.

### 6. Important: Socket.IO / real-time does not work on Vercel's default runtime
TicketHub uses a custom `server.ts` that wraps Next.js in an HTTP server and attaches Socket.IO for live ticket-count updates. Vercel's serverless functions cannot hold long-lived WebSocket connections, so:

- `Socket.IO` is **not initialized** on Vercel (`getSocketIO()` returns `null`).
- The app degrades gracefully — all payment flows, dashboards, and API routes still work.
- Real-time ticket count updates (`join-event`, `ticket-count-update`, `emitTicketCountUpdate`) will not fire on Vercel.

**For full real-time features**, deploy to a Node host that supports custom servers (Railway, Render, Fly.io, AWS EC2) using:
```bash
npm run build && npm run start   # starts server.ts (tsx watch in dev; next start in prod)
```

### 7. Local verification
Before deploying, confirm a clean production build:

```bash
npm run build      # prisma generate + next build
npm run start:next # next start — serves on http://localhost:3000
```

## Alternative: Non-Vercel host (full features incl. Socket.IO)

Use a host that runs a long-lived Node process:

```bash
docker run -d --name tickethub-mongo -p 27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec tickethub-mongo mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
cp .env.example .env.local
# edit .env.local with real values
npx prisma db push
npm run start          # tsx watch server.ts (dev) or set NODE_ENV=production + next start
```

## Files changed for deployability
- `components/tickets/PaymentReturn.tsx` — added missing component imported by `/tickets/success` and `/tickets/mpesa-success` pages
- `app/api/admin/payouts/route.ts` — fixed undefined `payouts` variable and non-existent `organizer` relation (use `eventOwner`)
- `app/api/tickets/session/[sessionId]/route.ts` — look up M-Pesa tickets by `checkoutRequestId` (was only `stripeSessionId`/`paystackReference`)
- `app/dashboard/admin/payouts/page.tsx` — removed duplicate "Payment Method" column header
