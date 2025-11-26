# Dashboard Custom Tours Tab - Summary

## ✅ Implementation Complete

### Features Added

1. **Tab Navigation**
   - Added "My Bookings" and "Custom Tours" tabs
   - Tab switching with active state
   - URL parameter support: `?tab=custom`

2. **Custom Tours Tab**
   - Fetches data from `GET /api/user/custom-tours`
   - Displays custom tour cards with full details
   - Shows itinerary preview with location tags
   - Displays total price in USD
   - Status badges (pending, approved, rejected, paid, cancelled)

3. **Conditional Action Buttons**

   **Status = Pending:**
   - "Pay Now" button → Creates Stripe PaymentIntent
   - "Cancel Request" button → Cancels the tour

   **Status = Approved:**
   - "Pay Now" button → Creates Stripe PaymentIntent
   - "Message Admin" button → Opens email client

   **Status = Paid:**
   - "View Itinerary" button → Shows full itinerary (placeholder)

   **Status = Cancelled:**
   - No buttons (card is greyed out)

---

## 📁 Files Created/Modified

### 1. `api/user/custom-tours.js` - NEW
- GET endpoint to fetch user's custom tours
- Returns array of custom tour requests
- Includes itinerary, addons, pricing, status

### 2. `api/custom/[id]/payment-intent.js` - NEW
- POST endpoint to create PaymentIntent for existing tour
- Applies 10% discount
- Creates payment record
- Returns clientSecret for Stripe

### 3. `api/custom/[id]/cancel.js` - NEW
- POST endpoint to cancel custom tour
- Updates status to 'cancelled'
- Validates tour can be cancelled

### 4. `dashboard.html` - MODIFIED
- Added tab navigation UI
- Added Custom Tours tab content
- Added `loadCustomTours()` function
- Added `renderCustomTourCards()` function
- Added `createCustomTourCard()` function
- Added `getCustomTourStatusBadge()` function
- Added `getCustomTourActions()` function
- Added action handlers:
  - `payNowCustomTour()`
  - `cancelCustomTour()`
  - `messageAdmin()`
  - `viewCustomTourItinerary()`
- Added tab switching logic
- Added URL parameter handling for `?tab=custom`

---

## 🎨 Custom Tour Card Structure

```html
<div class="custom-tour-card">
  <div class="custom-tour-card-header">
    <div>
      <h3>Custom Tour {id}...</h3>
      <p>Date & Time</p>
    </div>
    <span class="status-badge">Status</span>
  </div>
  <div class="booking-card-body">
    <div class="itinerary-preview">
      <h4>Itinerary</h4>
      <div>{location tags}</div>
      <p>Add-ons: ...</p>
      <p>Travelers • Duration</p>
    </div>
    <div class="booking-price">
      <span>$XXX.XX USD</span>
    </div>
  </div>
  <div class="booking-card-actions">
    {conditional buttons}
  </div>
</div>
```

---

## 🔗 API Endpoints

### GET /api/user/custom-tours?userId={userId}
Returns array of custom tour requests for the user.

**Response:**
```json
[
  {
    "id": "uuid",
    "itinerary": {
      "locations": ["gamcheon", "haeundae"],
      "startTime": "2025-02-01T09:00:00",
      "durationHours": 6
    },
    "travelers": 4,
    "startTime": "2025-02-01T09:00:00",
    "durationHours": 6,
    "basePrice": 20000,
    "addons": ["drone", "photographer"],
    "totalPrice": 32500,
    "status": "pending",
    "createdAt": "2025-01-01T00:00:00",
    "updatedAt": "2025-01-01T00:00:00"
  }
]
```

### POST /api/custom/:id/payment-intent
Creates Stripe PaymentIntent for existing custom tour.

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 29250,
  "originalAmount": 32500,
  "discountAmount": 3250
}
```

### POST /api/custom/:id/cancel
Cancels a custom tour request.

**Response:**
```json
{
  "success": true,
  "message": "Tour cancelled successfully"
}
```

---

## ✅ Status Badge Colors

- **Pending:** Yellow (#fff3cd)
- **Approved:** Blue (#d1ecf1)
- **Rejected:** Red (#f8d7da)
- **Paid:** Green (#d4edda)
- **Cancelled:** Red (#f8d7da) - Card is greyed out

---

## 🎯 Next Steps

1. ✅ Test tab switching
2. ✅ Test custom tours loading
3. ✅ Test Pay Now flow
4. ✅ Test Cancel Request
5. ✅ Implement Stripe payment page for clientSecret
6. ✅ Implement View Itinerary modal/page
7. ✅ Update Stripe webhook to handle custom tour payments

---

## 📝 Notes

- Custom tour cards are styled consistently with booking cards
- Cancelled tours are visually greyed out (opacity: 0.6)
- Empty state shows "Create Custom Tour" button
- All actions include error handling and user feedback

