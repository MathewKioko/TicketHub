# TicketHub — Complete `.env` Setup Guide

This guide explains exactly which credentials you need to test every feature of TicketHub.

---

## ⚠️ Important: You're already in production

Since the project is **live in production**, follow these rules so local testing does **not** affect real users or trigger real charges:

1. **NEVER reuse your live Paystack/Stripe/M-Pesa keys locally.** Use **sandbox/test** keys (`sk_test_...`, `pk_test_...`, M-Pesa `sandbox`). Otherwise a test purchase in your local app will charge a real card.
2. **Use a SEPARATE local database.** Point `DATABASE_URL` at a **different** MongoDB database (e.g. `tickethub_local`), not your production database. Otherwise local test registrations/events/tickets will appear in production.
3. **Create a separate `.env` file locally** (`.env` is already git-ignored). Your production environment variables live in your hosting provider (Vercel/Railway/Fly.io etc.) — those are independent of the local `.env` file.
4. **If you need your production env var values**, export them from your hosting provider's dashboard (e.g. Vercel → Project → Settings → Environment Variables), but replace the **payment keys with test keys** and **database URL with a local/dev DB** before testing locally.
5. **Test payment webhooks locally** using tunnels (e.g. `ngrok http 3000`) or by triggering the "verify pending payments" endpoint — never point your production webhook URL at localhost.

If you just want a **safe, complete local test environment**, use the `.env` template below exactly as-is (it uses sandbox/test values only).

---

## Quick Start (Minimum to boot the app)

```env
# ==== REQUIRED ====
DATABASE_URL=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/tickethub?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_me

# ==== Base URL (for callbacks & Socket.IO CORS) ====
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> The app will **boot** with just `DATABASE_URL` + `JWT_SECRET`. Everything else unlocks specific features.

---

## Feature-by-Feature Credentials

### 1. Core Auth (Register / Login / Verify / Organizer requests)
| Variable | Needed | Where to get it |
|---|---|---|
| `DATABASE_URL` | ✅ Required | [MongoDB Atlas](https://www.mongodb.com/atlas) → Create free cluster → copy connection string |
| `JWT_SECRET` | ✅ Required | Any long random string (`openssl rand -hex 32`) |

> Note: The register API **returns the verification token directly** in the response (dev mode), so you can verify your account without an email service. You do NOT need SMTP/email credentials to test signup.

---

### 2. Paystack Payments (Main ticketing/payment method — **needed for booking tickets**)
| Variable | Needed | Where to get it |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | ✅ Required | [Paystack Dashboard](https://dashboard.paystack.com) → Settings → API Keys → **Secret Key** (use `sk_test_...`) |
| `PAYSTACK_PUBLIC_KEY` | ✅ Required | Paystack Dashboard → Settings → API Keys → **Public Key** (`pk_test_...`) |
| `INTERNAL_WEBHOOK_SECRET` | ✅ Required for webhooks | Make up any random secret string — the Paystack webhook sends it as the `x-internal-secret` header |
| `PAYSTACK_BASE_URL` | Optional | Defaults to `https://api.paystack.co` |
| `APP_NAME` | Optional | Defaults to `tickethub` |

**Testing Paystack locally:**
- Sign up free at [Paystack](https://paystack.com) (supports Kenya 🇰🇪).
- Use the **test secret/public keys** (start with `sk_test_` / `pk_test_`).
- Test card: `4084 0840 8408 4081` (any future expiry, CVV `408`, any PIN).
- Mobile Money (M-Pesa on Paystack): use Paystack's test phone `254708374149`.

---

### 3. M-Pesa (Safaricom STK Push)
| Variable | Needed | Where to get it |
|---|---|---|
| `MPESA_CONSUMER_KEY` | ✅ Required | [Safaricom Developer Portal](https://developer.safaricom.co.ke/) → My Apps → create app |
| `MPESA_CONSUMER_SECRET` | ✅ Required | Same place as above |
| `MPESA_SHORTCODE` | ✅ Required | Your paybill/till number (sandbox: `174379`) |
| `MPESA_PASSKEY` | ✅ Required | Sandbox passkey from the same app (or use the standard sandbox passkey) |
| `MPESA_ENVIRONMENT` | ✅ | `sandbox` for testing (or `production`) |
| `MPESA_CALLBACK_URL` | ✅ Required | e.g. `http://localhost:3000/api/mpesa/callback` |

**Testing M-Pesa sandbox:**
- Use the sandbox STK push test phone: `254708374149`.
- Enter PIN `1234` when prompted on the sandbox simulator.
- See the [MPESA_INTEGRATION_GUIDE.md](MPESA_INTEGRATION_GUIDE.md) for full details.

---

### 4. Stripe (Secondary payment gateway)
| Variable | Needed | Where to get it |
|---|---|---|
| `STRIPE_SECRET_KEY` | ✅ | [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API Keys (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ for webhooks | Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook` |

**Testing Stripe locally:**
- Test card: `4242 4242 4242 4242`, any future expiry, CVV `123`.
- Run the Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

---

### 5. Google OAuth (Sign in with Google)
| Variable | Needed | Where to get it |
|---|---|---|
| `GOOGLE_CLIENT_ID` | ✅ | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Same place |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` (must match the redirect URI exactly) |

**Redirect URI to add in Google Console:**
```
http://localhost:3000/api/auth/callback/google
```
Full steps in [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md).

---

### 6. Redis Caching (Optional — improves performance)
| Variable | Needed | Where to get it |
|---|---|---|
| `REDIS_URL` | Optional | [Redis Cloud](https://redis.com) or local Redis (`redis://localhost:6379`) |

> The app **gracefully skips Redis** if not set or if it points to `localhost`. Not needed for basic testing.

---

## Complete `.env` template

```env
# =====================
# REQUIRED — Core
# =====================
DATABASE_URL=mongodb+srv://USER:PASS@cluster.mongodb.net/tickethub?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_long_random_string
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =====================
# PAYSTACK (ticketing payments)
# =====================
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
INTERNAL_WEBHOOK_SECRET=your_random_webhook_secret
# PAYSTACK_BASE_URL=https://api.paystack.co
# APP_NAME=tickethub

# =====================
# M-PESA (Safaricom)
# =====================
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_sandbox_passkey
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=http://localhost:3000/api/mpesa/callback

# =====================
# STRIPE
# =====================
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# =====================
# GOOGLE OAUTH
# =====================
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxx

# =====================
# REDIS (optional)
# =====================
# REDIS_URL=redis://localhost:6379
```

---

## Feature Test Checklist

| Feature | Credentials needed |
|---|---|
| Register / Verify / Login | `DATABASE_URL`, `JWT_SECRET` |
| Browse & search events | `DATABASE_URL` |
| Create Event (Organizer) | `DATABASE_URL`, `JWT_SECRET` (+ become organizer or set admin) |
| Book & pay for tickets | + `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` |
| Paystack webhook → ticket confirm | + `INTERNAL_WEBHOOK_SECRET` |
| M-Pesa STK push | + `MPESA_*` keys |
| Stripe checkout | + `STRIPE_SECRET_KEY` |
| Google Sign-In | + `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| QR Scanner (check-in) | `DATABASE_URL` |
| Admin dashboard | Run `npx tsx scripts/set-admin.ts your@email.com` |

---

## How to create an admin user (to test admin dashboard)

1. Register a normal user on the site.
2. Run:
   ```
   npx tsx scripts/set-admin.ts your@email.com
   ```
3. Log in — you'll now land on the admin dashboard.

---

## Running the app

```
cd "c:/Users/MY COMPUTER/Downloads/TicketHub"
npm.cmd install
npm.cmd run dev
```

Then open **http://localhost:3000** (not `0.0.0.0:3000` — the browser can't reach that address).
</content>
</invoke>

