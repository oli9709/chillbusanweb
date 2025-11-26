# Custom Tour API Endpoints - Summary

## ✅ Endpoints Created

### 1. POST /api/custom/pay-now
Creates custom tour request with Stripe PaymentIntent (10% discount applied)

**Input:**
```json
{
  "selectedLocations": ["gamcheon", "haeundae", ...],
  "addons": ["drone", "photographer"],
  "travelers": 4,
  "startTime": "2025-02-01T09:00:00",
  "durationHours": 6,
  "totalPrice": 250,
  "notes": "Optional notes",
  "paymentOption": "pay_now"
}
```

**Logic:**
1. ✅ Validates input (locations: 4-5, travelers: 1-10, duration: 4-8 hours)
2. ✅ Recalculates price server-side for security
3. ✅ Creates `CustomTourRequest` with status="pending"
4. ✅ Applies 10% discount (totalPrice * 0.9)
5. ✅ Creates Stripe PaymentIntent with discounted amount
6. ✅ Creates `CustomTourPayment` record
7. ✅ Sends admin email alert
8. ✅ Returns `clientSecret` for Stripe payment

**Response:**
```json
{
  "success": true,
  "bookingId": "uuid",
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 22500,
  "originalAmount": 25000,
  "discountAmount": 2500
}
```

---

### 2. POST /api/custom/reserve
Creates custom tour request without payment (pay after tour)

**Input:**
```json
{
  "selectedLocations": ["gamcheon", "haeundae", ...],
  "addons": ["drone"],
  "travelers": 2,
  "startTime": "2025-02-01T09:00:00",
  "durationHours": 5,
  "totalPrice": 200,
  "notes": "Optional notes",
  "paymentOption": "pay_after"
}
```

**Logic:**
1. ✅ Validates input (same as pay-now)
2. ✅ Recalculates price server-side
3. ✅ Creates `CustomTourRequest` with status="pending"
4. ✅ No Stripe initialization
5. ✅ Sends admin email alert
6. ✅ Returns `bookingId`

**Response:**
```json
{
  "success": true,
  "bookingId": "uuid",
  "message": "Tour reservation created successfully. You will pay after the tour."
}
```

---

## 🔒 Server-Side Validations

### Price Recalculation
- **Location Price:** $50 per location (server-enforced)
- **Add-on Prices:**
  - Drone: $50
  - Photographer: $75
  - Pickup: $30
- **Validation:** Client price must match server calculation (allows $1 difference for rounding)
- **Security:** Server always uses its own calculation, ignores client price if mismatch

### Input Validations
- **Locations:** Must be array with 4-5 items
- **Travelers:** Must be between 1 and 10
- **Duration:** Must be between 4 and 8 hours
- **Start Time:** Required, must be valid ISO datetime string

---

## 📧 Admin Email Alerts

Both endpoints send email alerts to admin with:
- Booking ID
- User ID (or "Guest")
- Travelers count
- Date & Time
- Duration
- Selected locations
- Add-ons
- Total price
- Payment status
- Notes (if provided)
- Link to admin panel

**Email Configuration:**
- Uses `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- Admin email from `ADMIN_EMAIL` env var (defaults to chilltours.official@gmail.com)

---

## 💾 Database Schema

### CustomTourRequest Table
- `id` (UUID, primary key)
- `userId` (UUID, optional)
- `itinerary` (JSONB) - { locations, startTime, durationHours }
- `travelers` (INTEGER)
- `startTime` (TIMESTAMP)
- `durationHours` (INTEGER)
- `basePrice` (INTEGER) - in cents
- `addons` (JSONB, optional) - { items: [...] }
- `totalPrice` (INTEGER) - in cents
- `status` (ENUM) - pending, approved, rejected, paid, cancelled
- `createdAt`, `updatedAt` (TIMESTAMP)

### CustomTourPayment Table
- `id` (UUID, primary key)
- `customTourId` (UUID, foreign key)
- `stripePaymentIntentId` (TEXT, optional)
- `amount` (INTEGER) - in cents
- `paymentStatus` (ENUM) - succeeded, failed, refunded
- `createdAt` (TIMESTAMP)

---

## 🔗 Integration Points

### Frontend (custom/summary.html)
- Sends POST request with tour data
- Handles `clientSecret` for Stripe payment
- Redirects to dashboard on success

### Stripe Integration
- PaymentIntent created with metadata
- Metadata includes: customTourId, userId, type, originalPrice, discountAmount
- Webhook should update payment status when payment succeeds

### Dashboard
- Receives `bookingId` in query params
- Should display custom tour bookings in `tab=custom` section

---

## 🚨 Error Handling

- **400:** Validation errors (missing fields, invalid values)
- **500:** Server errors (database, Stripe, email failures)
- All errors logged to Sentry
- User-friendly error messages returned

---

## 📝 Environment Variables Required

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe (for pay-now endpoint)
STRIPE_SECRET_KEY=sk_xxx

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=chilltours.official@gmail.com
EMAIL_PASS=xxx
ADMIN_EMAIL=chilltours.official@gmail.com

# Application
BASE_URL=https://chillbusantours.com
```

---

## ✅ Next Steps

1. Run database migration to create `custom_tour_requests` and `custom_tour_payments` tables
2. Test endpoints with sample data
3. Integrate Stripe Elements in frontend for payment
4. Update Stripe webhook to handle custom tour payments
5. Add custom tour section to dashboard

