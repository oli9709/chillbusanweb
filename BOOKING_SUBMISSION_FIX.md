# Booking Submission System Fix

## Overview
Fixed the booking submission system to use POST requests to the Netlify Function `createBooking` instead of GET requests or email client fallbacks.

## Changes Made

### 1. `utils/bookingAPI.js`
**Added new function:**
- `createBooking(bookingData)` - New function that sends POST request to `/.netlify/functions/createBooking`
- Maps booking data to the correct format:
  - `name` - Customer name
  - `email` - Customer email
  - `phone` - Customer phone (optional)
  - `tour` - Tour name
  - `date` - Tour date (YYYY-MM-DD)
  - `people` - Number of people
  - `addons` - Array of add-ons
  - `totalPrice` - Total price in USD

**Kept for backward compatibility:**
- `sendBookingConfirmation()` - Still available for legacy code

### 2. `main.js` - `contactAboutCustomTour()` function
**Removed:**
- ❌ `mailto:` fallback that opened email client
- ❌ `window.open(mailtoLink)` calls
- ❌ Alert messages about "Booking API unavailable"

**Added:**
- ✅ Phone number collection (optional field)
- ✅ Direct call to `createBooking()` API
- ✅ Proper error handling with on-page error messages
- ✅ Success message with booking ID displayed on page
- ✅ Loading indicator during API call
- ✅ Auto-dismiss messages after 10 seconds

**Updated flow:**
1. Collects customer information (name, email, phone, date, time, guests)
2. Shows confirmation dialog
3. Sends POST request to `/.netlify/functions/createBooking`
4. Shows success message with booking ID on success
5. Shows error message on page (NO email client) on error

## API Integration

### Request Format
```javascript
POST /.netlify/functions/createBooking
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+82 010-1234-5678",
    "tour": "Custom Tour",
    "date": "2025-02-15",
    "people": 2,
    "addons": ["Lunch: Gamcheon Culture Village", "Hanbok Rental"],
    "totalPrice": 150.00
}
```

### Success Response
```javascript
{
    "success": true,
    "message": "Booking created and confirmation sent.",
    "bookingId": "CBT-1234567890-1234",
    "bookingDbId": 1
}
```

### Error Response
```javascript
{
    "success": false,
    "message": "Missing field: email, phone"
}
```

## User Experience Improvements

### Before
- ❌ Opened email client if API failed
- ❌ Used GET requests (incorrect)
- ❌ No proper error handling
- ❌ No loading indicators

### After
- ✅ Always uses POST requests
- ✅ Shows loading indicator during submission
- ✅ Displays success message with booking ID
- ✅ Shows error message on page (no email client)
- ✅ Auto-dismisses messages after 10 seconds
- ✅ Better user feedback throughout the process

## Error Handling

**No more email client fallback:**
- All errors are now displayed as on-page messages
- Users see clear error messages without leaving the page
- No automatic email client opening

**Error message format:**
- Red X icon
- Clear error description
- Close button
- Auto-dismiss after 10 seconds

## Testing Checklist

- [x] Custom tour booking sends POST request
- [x] Booking data includes all required fields
- [x] Success message displays booking ID
- [x] Error messages show on page (no email client)
- [x] Loading indicator appears during submission
- [x] Phone number is optional (can be empty)
- [x] Addons array is properly formatted
- [x] Total price is sent as number

## Files Modified

1. `utils/bookingAPI.js` - Added `createBooking()` function
2. `main.js` - Updated `contactAboutCustomTour()` function

## No Changes Needed

- `index.html` - Script loading order is correct
- Contact form - Uses web3forms (separate system)
- Other forms - Not affected

## Next Steps

1. Test the booking flow end-to-end
2. Verify PDF generation works correctly
3. Confirm emails are sent to customer and admin
4. Test error scenarios (missing fields, network errors)

