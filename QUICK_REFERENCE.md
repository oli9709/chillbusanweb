# Chill Busan Tours - Quick Reference Guide

## 🎯 Project in 30 Seconds
**Tour booking website** for Busan, South Korea. Built with vanilla JS, Supabase, Stripe. Features: tour packages, custom tour builder, user accounts, booking system, payment processing, admin panel.

---

## ✅ What's Done

### Core Features
- ✅ Landing page with tour packages
- ✅ Custom tour builder (4-5 locations, $50 each)
- ✅ User authentication (Supabase)
- ✅ Booking system with Stripe payments
- ✅ User dashboard (view bookings, download PDFs)
- ✅ Admin panel (manage bookings, custom tours)
- ✅ Email notifications (booking confirmations)
- ✅ PDF generation (booking confirmations)
- ✅ 10% welcome discount system
- ✅ Comments/reviews system

### Technical Implementation
- ✅ Supabase database (PostgreSQL)
- ✅ Stripe payment integration
- ✅ Netlify Functions (serverless)
- ✅ Prisma ORM (custom tours)
- ✅ Email system (Nodemailer/Gmail)
- ✅ Error tracking (Sentry)
- ✅ Analytics (Google Analytics, PostHog)

---

## ⚠️ What Needs to Be Done

### Critical (Before Launch)
1. **Testing**
   - [ ] End-to-end booking flow
   - [ ] Payment processing (Stripe)
   - [ ] Email delivery
   - [ ] Mobile devices

2. **Environment Setup**
   - [ ] Verify all Supabase keys in Netlify
   - [ ] Verify Stripe keys (test + production)
   - [ ] Verify email SMTP credentials
   - [ ] Set up Stripe webhooks

3. **Database**
   - [ ] Run Prisma migrations
   - [ ] Verify all tables exist
   - [ ] Test RLS policies

4. **Deployment**
   - [ ] Production environment variables
   - [ ] Domain configuration
   - [ ] SSL verification

### Nice to Have (Post-Launch)
- Multi-language support
- Tour availability calendar
- Customer ratings/reviews
- SEO optimization

---

## 🔑 Key Files

```
index.html          → Main landing page
dashboard.html      → User dashboard
admin.html          → Admin panel
login.html          → Login page
signup.html         → Sign up page

api/booking/        → Booking endpoints
api/custom/         → Custom tour endpoints
api/admin/          → Admin endpoints

src/utils/supabase.js → Supabase client
components/bookingModal.js → Booking modal

prisma/schema.prisma → Database schema
```

---

## 🔐 Environment Variables Needed

```
# Supabase
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=chilltours.official@gmail.com
EMAIL_PASS=xxx
ADMIN_EMAIL=chilltours.official@gmail.com

# App
BASE_URL=https://chillbusantours.com
SENTRY_DSN=xxx
```

---

## 🚀 Tech Stack

- **Frontend:** HTML/CSS/JavaScript (vanilla)
- **Backend:** Netlify Functions (serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Email:** Nodemailer (Gmail SMTP)
- **PDF:** PDFKit
- **ORM:** Prisma (custom tours)
- **Hosting:** Netlify

---

## 📊 Current Status

**Status:** Development Complete ✅  
**Next:** Testing & Deployment 🚀

**Completed:** ~95%  
**Remaining:** Testing, environment setup, deployment

---

## 📝 Quick Commands

```bash
# Run Prisma migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Run tests
npm test

# Open Prisma Studio
npm run prisma:studio
```

---

## 🐛 Common Issues

1. **"Supabase client not initialized"**
   - Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `config.js`
   - Verify environment variables in Netlify

2. **"Payment failed"**
   - Check Stripe keys (test vs production)
   - Verify webhook endpoint configured

3. **"Email not sending"**
   - Verify Gmail App Password (not regular password)
   - Check SMTP credentials

4. **"Database connection error"**
   - Verify `DATABASE_URL` or `NETLIFY_DATABASE_URL`
   - Check Supabase project status

---

## 📞 Quick Links

- **Repo:** https://github.com/oli9709/chillbusanweb
- **Email:** theofficialali05@gmail.com
- **Instagram:** @chilltours_busan

---

**For detailed information, see:** `PROJECT_SUMMARY.md`

