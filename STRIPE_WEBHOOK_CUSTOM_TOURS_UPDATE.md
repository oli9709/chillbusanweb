# Stripe Webhook Custom Tours Update - Summary

## ✅ Implementation Complete

### Features Added

1. **Custom Tour Payment Handling**
   - Detects `payment_intent.succeeded` events with `metadata.customTourId`
   - Updates `CustomTourRequest.status` to "paid"
   - Stores payment record in `CustomTourPayment` table
   - Sends confirmation email to customer and admin

2. **Custom Tour Refund Handling**
   - Detects `charge.refunded` events
   - Looks up custom tour via payment record or metadata
   - Updates `CustomTourRequest.status` to "cancelled"
   - Updates `CustomTourPayment.paymentStatus` to "refunded"

---

## 🔄 Webhook Event Flow

### Payment Success Flow

1. Stripe sends `payment_intent.succeeded` event
2. Webhook checks for `metadata.customTourId`
3. If found:
   - Updates `custom_tour_requests.status = 'paid'`
   - Upserts payment record in `custom_tour_payments`
   - Sends confirmation email with tour details
   - Returns success response

### Refund Flow

1. Stripe sends `charge.refunded` event
2. Webhook extracts `payment_intent` from charge
3. Looks up custom tour:
   - First checks `metadata.customTourId`
   - If not found, queries `custom_tour_payments` table
4. If custom tour found:
   - Updates `custom_tour_requests.status = 'cancelled'`
   - Updates `custom_tour_payments.paymentStatus = 'refunded'`
   - Returns success response

---

## 📧 Email Notifications

### Payment Confirmation Email
- **Subject:** "Payment Confirmed - Custom Tour {ID}"
- **Includes:**
  - Tour ID
  - Date & Time
  - Duration
  - Travelers count
  - Selected locations
  - Add-ons
  - Total price (USD)
  - Link to dashboard

### Admin Notification
- Sent to `ADMIN_EMAIL` (default: chilltours.official@gmail.com)
- Includes full tour details

---

## 💾 Database Updates

### CustomTourRequest Table
- `status` updated to `'paid'` on successful payment
- `status` updated to `'cancelled'` on refund

### CustomTourPayment Table
- New record created/updated with:
  - `customTourId`
  - `stripePaymentIntentId`
  - `amount` (in cents)
  - `paymentStatus = 'succeeded'`
- On refund: `paymentStatus` updated to `'refunded'`

### stripe_events Table
- All events logged with `custom_tour_id` field
- Marked as `processed = true` after handling

---

## 🔗 Event Metadata Structure

### Payment Intent Metadata (from custom tour creation)
```json
{
  "customTourId": "uuid",
  "userId": "uuid",
  "type": "custom_tour",
  "originalPrice": "32500",
  "discountAmount": "3250",
  "travelers": "4"
}
```

---

## ✅ Validation Checklist

- [x] `payment_intent.succeeded` with `customTourId` updates tour status
- [x] Payment record stored in `custom_tour_payments`
- [x] Confirmation email sent to customer
- [x] Notification email sent to admin
- [x] `charge.refunded` updates tour status to 'cancelled'
- [x] Payment record updated to 'refunded' status
- [x] Events logged to `stripe_events` table
- [x] Error handling for missing tours/payments
- [x] Webhook doesn't fail if email sending fails

---

## 🧪 Testing

### Test Payment Success
```bash
# Using Stripe CLI
stripe trigger payment_intent.succeeded

# Or create a test payment intent with metadata:
# metadata: { customTourId: "test-tour-id" }
```

### Test Refund
```bash
# Using Stripe CLI
stripe trigger charge.refunded

# Or refund a payment intent that has a custom tour payment record
```

---

## 📝 Notes

- Custom tour payment handling runs **before** regular booking handling
- If `customTourId` is not found, webhook logs warning but returns 200 (event still logged)
- Email failures don't cause webhook to fail
- Refund lookup is robust: checks metadata first, then payment records table
- All database operations use Supabase client with service role key

