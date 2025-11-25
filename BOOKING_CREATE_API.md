# POST /api/bookings/create - Implementation Summary

## Overview
New booking endpoint that handles itemized bookings with payment options and Stripe integration.

## Endpoint
`POST /api/bookings/create`

## Request Body
```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+82-10-1234-5678",
    "id": "optional-uuid"
  },
  "items": [
    {
      "type": "tour",
      "id": "tour-uuid",
      "name": "Hidden Gems",
      "unit_price_krw": 289000,
      "quantity": 1
    }
  ],
  "payment_option": "pay_now",  // or "pay_after"
  "date": "2025-12-01",
  "pickup_location": "Haeundae Beach"
}
```

## Behavior

### 1. User Upsert
- Creates user if doesn't exist (by email or ID)
- Updates user info if exists
- Returns user ID for booking

### 2. Transactional Booking Creation
- Calculates `total_amount_krw` from items server-side (doesn't trust client)
- If `payment_option == 'pay_now'`: applies 10% discount
  - `discount_percent = 10`
  - `final_amount_krw = round(total * 0.9)`
- If `payment_option == 'pay_after'`: no discount
  - `discount_percent = 0`
  - `final_amount_krw = total_amount_krw`
- Creates `bookings` row with `status = 'pending'`
- Inserts `booking_items` rows for each item

### 3. Stripe Integration (pay_now only)
- Creates Stripe Checkout Session
- Currency: KRW (no cents - unit_amount is already in KRW)
- Attaches metadata: `{booking_id, user_id, date, pickup_location}`
- Saves `stripe_session_id` on booking
- Returns `checkoutUrl` for redirect

### 4. Response
- **pay_now**: `{ success: true, checkoutUrl: "...", bookingId: "...", sessionId: "..." }`
- **pay_after**: `{ success: true, bookingId: "..." }`

## Environment Variables Required

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
BASE_URL=https://your-domain.com (for Stripe redirect URLs)
```

## Database Tables Used

1. **users** - Upsert user info
2. **bookings** - Create booking record
3. **booking_items** - Create item records

## Error Handling

- Validates all required fields
- Uses `.maybeSingle()` for single row queries
- Handles duplicate users gracefully
- Rolls back booking if items insert fails
- Returns booking ID even if Stripe fails (for pay_now)

## Testing

### Sample cURL Command

```bash
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+82-10-1234-5678"
    },
    "items": [
      {
        "type": "tour",
        "id": "tour-123",
        "name": "Hidden Gems Tour",
        "unit_price_krw": 289000,
        "quantity": 1
      }
    ],
    "payment_option": "pay_now",
    "date": "2025-12-01",
    "pickup_location": "Haeundae Beach"
  }'
```

### Expected Response (pay_now)
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "bookingId": "uuid-here",
  "sessionId": "cs_test_..."
}
```

### Expected Response (pay_after)
```json
{
  "success": true,
  "bookingId": "uuid-here"
}
```

## Files Created

- `/api/bookings/create.js` - Main endpoint implementation
- `package.json` - Added `stripe` dependency

## Notes

- Server-side total calculation prevents client manipulation
- Discount only applies to `pay_now` bookings
- Stripe session includes all items with proper KRW pricing
- Booking is created even if Stripe fails (for resilience)
