# Stripe Webhook Endpoint Setup

## Endpoint
`POST /api/stripe/webhook`

## Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=chilltours.official@gmail.com
EMAIL_PASS=your-app-password
```

## Webhook Events Handled

1. **checkout.session.completed**
   - Updates booking status to 'paid'
   - Saves payment_intent to booking
   - Sends confirmation emails

2. **payment_intent.succeeded**
   - Updates booking status to 'paid'
   - Saves payment_intent to booking
   - Sends confirmation emails

## Database Tables

### stripe_events
- Logs all Stripe webhook events
- Fields: `id`, `event_id`, `event_type`, `booking_id`, `session_id`, `payment_intent`, `event_data`, `processed`, `created_at`

### bookings
- Updated with `status='paid'` and `stripe_payment_intent` when payment succeeds

## Testing with Stripe CLI

### 1. Install Stripe CLI
```bash
brew install stripe/stripe-cli/stripe
# or download from https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward webhooks to local endpoint
```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

This will output a webhook signing secret like:
```
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

Set this as `STRIPE_WEBHOOK_SECRET` in your environment.

### 4. Trigger test event
```bash
stripe trigger checkout.session.completed
```

Or trigger payment_intent.succeeded:
```bash
stripe trigger payment_intent.succeeded
```

## Testing with cURL

### Sample webhook payload (checkout.session.completed)
```bash
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=..." \
  -d '{
    "id": "evt_test_webhook",
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_...",
        "payment_intent": "pi_test_...",
        "metadata": {
          "booking_id": "uuid-here",
          "user_id": "uuid-here"
        }
      }
    }
  }'
```

**Note:** The Stripe signature must be valid. Use Stripe CLI for proper testing.

## Validation Checklist

- [ ] Webhook endpoint responds to POST requests
- [ ] Signature verification works (returns 400 if invalid)
- [ ] Events are logged to `stripe_events` table
- [ ] Booking status updates to 'paid' on successful payment
- [ ] `stripe_payment_intent` is saved to booking
- [ ] Confirmation emails sent to customer and admin
- [ ] No unhandled exceptions in logs

## Vercel Configuration

For Vercel, you may need to configure the API route to handle raw body:

1. The endpoint uses `bodyParser: false` configuration
2. If raw body is not available, it falls back to parsed body (less secure)
3. For production, ensure Vercel passes raw body to the function

## Webhook URL in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Error Handling

- Invalid signature → Returns 400 with error message
- Missing booking → Logs warning, returns 200 (event still logged)
- Email failure → Logs error, doesn't fail webhook
- Database errors → Returns 500 with error details

## Files Created

- `/api/stripe/webhook.js` - Webhook handler
- Database migration: `stripe_events` table created
