# Phase 2: Booking System Rebuild - Complete

## ✅ Completed Tasks

### 1. Database Schema Migration
**File:** `db/migrations/2025_01_rebuild_bookings_schema.sql`

Created new `bookings_new` table with clean schema:
- `id` (uuid, primary key)
- `bookingId` (text, unique) - e.g., "CBT-1234567890-1234"
- `customerName` (text)
- `customerEmail` (text)
- `tourType` (text)
- `tourDate` (date)
- `price` (numeric 10,2)
- `paymentStatus` (text) - CHECK constraint: 'pending', 'paid', 'failed'
- `createdAt` (timestamptz)
- `updatedAt` (timestamptz)

**Indexes created:**
- `idx_bookings_bookingId` - Fast lookup by bookingId
- `idx_bookings_customerEmail` - User queries
- `idx_bookings_paymentStatus` - Status filtering
- `idx_bookings_tourDate` - Date-based queries

---

### 2. Backend Endpoint: `/api/booking/create`
**File:** `api/booking/create.js`

**Purpose:** Create a new booking with PENDING payment status

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "tourType": "Hidden Gems Tour",
  "tourDate": "2025-02-15",
  "price": 289000.00
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "bookingId": "CBT-1234567890-1234",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "tourType": "Hidden Gems Tour",
    "tourDate": "2025-02-15",
    "price": 289000.00,
    "paymentStatus": "pending",
    "createdAt": "2025-01-XX..."
  }
}
```

**Features:**
- ✅ Input validation (name, email format, date format, positive price)
- ✅ Date validation (cannot be in the past)
- ✅ Unique booking ID generation
- ✅ Automatic PENDING status
- ✅ Error handling with Sentry integration
- ✅ CORS headers configured

---

### 3. Backend Endpoint: `/api/booking/confirm`
**File:** `api/booking/confirm.js`

**Purpose:** Update booking payment status from PENDING to PAID or FAILED

**Request Body:**
```json
{
  "bookingId": "CBT-1234567890-1234",
  "paymentStatus": "paid"  // or "failed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking confirmed",
  "booking": {
    "id": "uuid",
    "bookingId": "CBT-1234567890-1234",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "tourType": "Hidden Gems Tour",
    "tourDate": "2025-02-15",
    "price": 289000.00,
    "paymentStatus": "paid",
    "createdAt": "2025-01-XX...",
    "updatedAt": "2025-01-XX..."
  }
}
```

**Features:**
- ✅ Validates bookingId exists
- ✅ Prevents double-confirmation (already paid check)
- ✅ Updates paymentStatus and updatedAt timestamp
- ✅ Error handling with Sentry integration
- ✅ CORS headers configured

---

### 4. Frontend Booking Form Update
**File:** `components/bookingModal.js`

**Changes:**
- ✅ Simplified form submission to match new API schema
- ✅ Removed complex items array structure
- ✅ Calculates total price (tour + add-ons + discount)
- ✅ Sends clean JSON to `/api/booking/create`
- ✅ Handles PENDING status response
- ✅ Updated success modal to show booking ID

**New Flow:**
1. User fills form → clicks "Complete Booking"
2. Frontend calculates total price
3. Sends to `/api/booking/create` with simplified schema
4. Booking created with `paymentStatus: 'pending'`
5. If "Pay Now" → TODO: Integrate payment gateway
6. If "Pay After" → Show success modal

---

## 📋 Next Steps

### Immediate Actions Required:

1. **Run Database Migration**
   ```sql
   -- Execute in Supabase SQL Editor:
   -- File: db/migrations/2025_01_rebuild_bookings_schema.sql
   ```

2. **Test Endpoints**
   - Test `/api/booking/create` with valid data
   - Test `/api/booking/create` with invalid data (validation)
   - Test `/api/booking/confirm` with valid bookingId
   - Test `/api/booking/confirm` with invalid bookingId

3. **Integrate Payment Gateway**
   - After booking is created (PENDING status)
   - Redirect to payment (Stripe/PayPal)
   - On payment success, call `/api/booking/confirm` with `paymentStatus: 'paid'`
   - On payment failure, call `/api/booking/confirm` with `paymentStatus: 'failed'`

4. **Update Webhook Handler**
   - Modify `api/stripe/webhook.js` to call `/api/booking/confirm` instead of direct DB update
   - This ensures consistent booking confirmation flow

---

## 🔄 Migration from Old System

### Old Endpoints (to be deprecated):
- `/api/bookings/create` - Complex schema with items array
- `/api/bookings/[id]/create-session` - Stripe session creation

### New Endpoints:
- `/api/booking/create` - Simple schema, always creates PENDING
- `/api/booking/confirm` - Updates status to PAID/FAILED

### Data Migration:
If you have existing bookings in the old `bookings` table, you'll need to:
1. Map old schema to new schema
2. Migrate data to `bookings_new` table
3. Update all references to use new table

---

## 📝 Schema Comparison

### Old Schema (Complex):
```javascript
{
  user: { name, email, phone, id },
  items: [{ type, id, name, unit_price_krw, quantity }],
  payment_option: 'pay_now' | 'pay_after',
  date: 'YYYY-MM-DD',
  pickup_location: 'string'
}
```

### New Schema (Simple):
```javascript
{
  customerName: 'string',
  customerEmail: 'string',
  tourType: 'string',
  tourDate: 'YYYY-MM-DD',
  price: number
}
```

---

## ✅ Validation Rules

### `/api/booking/create`:
- ✅ `customerName`: Required, non-empty string
- ✅ `customerEmail`: Required, valid email format
- ✅ `tourType`: Required, non-empty string
- ✅ `tourDate`: Required, YYYY-MM-DD format, not in past
- ✅ `price`: Required, positive number

### `/api/booking/confirm`:
- ✅ `bookingId`: Required, non-empty string, must exist
- ✅ `paymentStatus`: Required, must be 'paid' or 'failed'
- ✅ Booking must not already be 'paid'

---

## 🐛 Error Handling

Both endpoints include:
- ✅ Input validation with clear error messages
- ✅ Database error handling
- ✅ Sentry error logging
- ✅ Proper HTTP status codes (400, 404, 500)
- ✅ CORS support

---

## 📊 Database Table Structure

```sql
CREATE TABLE bookings_new (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bookingId text UNIQUE NOT NULL,
    customerName text NOT NULL,
    customerEmail text NOT NULL,
    tourType text NOT NULL,
    tourDate date NOT NULL,
    price numeric(10, 2) NOT NULL,
    paymentStatus text NOT NULL DEFAULT 'pending' 
        CHECK (paymentStatus IN ('pending', 'paid', 'failed')),
    createdAt timestamptz DEFAULT now(),
    updatedAt timestamptz DEFAULT now()
);
```

---

## 🎯 Summary

Phase 2 is complete with:
- ✅ Clean database schema
- ✅ Two focused backend endpoints
- ✅ Simplified frontend integration
- ✅ Proper validation and error handling
- ✅ Ready for payment gateway integration

The booking system is now rebuilt with a clean, maintainable architecture.

