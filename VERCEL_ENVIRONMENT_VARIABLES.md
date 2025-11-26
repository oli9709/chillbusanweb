# Vercel Environment Variables - Complete List

## Required Environment Variables for Chill Busan Tours

Add these in **Vercel Dashboard** → **Settings** → **Environment Variables**

---

## 🔐 Supabase (Database & Authentication)

### Server-side (API Routes)
- **`SUPABASE_URL`**
  - Your Supabase project URL
  - Format: `https://your-project-id.supabase.co`
  - Find in: Supabase Dashboard → Settings → API → Project URL
  - **Required for:** All API routes

- **`SUPABASE_SERVICE_ROLE_KEY`**
  - Supabase service role key (⚠️ KEEP SECRET!)
  - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Find in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
  - **Required for:** All API routes (admin operations, bookings, webhooks)

### Client-side (Frontend - NEXT_PUBLIC_ prefix)
- **`NEXT_PUBLIC_SUPABASE_URL`**
  - Same as `SUPABASE_URL` but for client-side access
  - **Required for:** Frontend authentication (login, signup, dashboard)

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
  - Supabase anonymous/public key
  - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Find in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
  - **Required for:** Frontend authentication

---

## 💳 Stripe (Payment Processing)

- **`STRIPE_SECRET_KEY`**
  - Stripe secret key (test or live)
  - Format: `sk_test_...` (test) or `sk_live_...` (production)
  - Find in: Stripe Dashboard → Developers → API keys → Secret key
  - **Required for:** Booking creation, payment sessions, refunds

- **`STRIPE_WEBHOOK_SECRET`**
  - Stripe webhook signing secret
  - Format: `whsec_...`
  - Find in: Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Signing secret
  - **Required for:** Webhook signature verification

---

## 📧 Email (Nodemailer)

- **`EMAIL_HOST`**
  - SMTP server hostname
  - Default: `smtp.gmail.com`
  - **Required for:** Booking confirmations, payment notifications

- **`EMAIL_PORT`**
  - SMTP server port
  - Default: `587`
  - **Required for:** Email sending

- **`EMAIL_USER`**
  - SMTP username (usually your email address)
  - Example: `chilltours.official@gmail.com`
  - **Required for:** Email authentication

- **`EMAIL_PASS`** or **`EMAIL_APP_PASSWORD`**
  - SMTP password or Gmail App Password
  - ⚠️ For Gmail: Use App Password (not regular password)
  - Generate at: https://myaccount.google.com/apppasswords
  - **Required for:** Email authentication

---

## 👤 Admin Panel

- **`ADMIN_EMAIL`**
  - Email address of admin user
  - Example: `admin@chillbusantours.com`
  - **Required for:** Admin panel access (`/admin.html`)
  - **Used in:** All `/api/admin/*` endpoints

---

## 🐛 Sentry (Error Tracking)

- **`SENTRY_DSN`**
  - Sentry project DSN
  - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
  - Find in: Sentry Dashboard → Settings → Projects → [Your Project] → Client Keys (DSN)
  - **Required for:** Error logging and monitoring
  - **Optional but recommended** for production

---

## 🌐 Application

- **`BASE_URL`**
  - Your production domain URL
  - Example: `https://chillbusantours.com`
  - Used for: Stripe Checkout success/cancel URLs
  - **Required for:** Payment redirects

- **`NODE_ENV`**
  - Environment mode
  - Values: `production`, `development`, `test`
  - Usually set automatically by Vercel
  - **Optional:** Vercel sets this automatically

---

## 📋 Complete List (Copy-Paste Format)

```
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=chilltours.official@gmail.com
EMAIL_PASS=your-app-password-here

# Admin
ADMIN_EMAIL=admin@chillbusantours.com

# Sentry (Optional but recommended)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Application
BASE_URL=https://chillbusantours.com
```

---

## 🔍 Where to Find Each Value

### Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL** → `SUPABASE_URL`
5. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Copy **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Secret Key:** Developers → API keys → Secret key
3. **Webhook Secret:** Developers → Webhooks → [Your endpoint] → Signing secret

### Gmail App Password
1. Go to [Google Account](https://myaccount.google.com)
2. Security → 2-Step Verification (must be enabled)
3. App passwords → Generate new app password
4. Use generated password for `EMAIL_PASS`

### Sentry
1. Go to [Sentry Dashboard](https://sentry.io)
2. Select your project
3. Settings → Projects → [Your Project] → Client Keys (DSN)
4. Copy the DSN

---

## ⚠️ Important Notes

1. **Client-side vs Server-side:**
   - Variables with `NEXT_PUBLIC_` prefix are exposed to the browser
   - Never put secrets in `NEXT_PUBLIC_` variables
   - `SUPABASE_SERVICE_ROLE_KEY` should NEVER have `NEXT_PUBLIC_` prefix

2. **Security:**
   - Never commit environment variables to git
   - Use Vercel's environment variable interface
   - Rotate keys regularly

3. **Testing:**
   - Use test keys for development
   - Switch to live keys only in production
   - Test webhook endpoint with Stripe CLI first

4. **Vercel Setup:**
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add each variable for **Production**, **Preview**, and **Development** environments
   - Click "Save" after adding each variable

---

## ✅ Verification Checklist

After adding all variables, verify:
- [ ] All Supabase variables set (4 total)
- [ ] Stripe keys set (2 total)
- [ ] Email credentials set (4 total)
- [ ] Admin email set
- [ ] Sentry DSN set (optional)
- [ ] BASE_URL set to production domain
- [ ] All variables saved in Vercel dashboard
- [ ] Redeploy application to apply changes

