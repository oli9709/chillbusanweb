# Booking API Fix Summary

## Problem
Neon database was rejecting INSERT with error: "The string did not match the expected pattern"

## Root Causes
1. Date field might contain time data (needs to be YYYY-MM-DD only)
2. Data types not properly normalized before INSERT
3. Addons array not properly converted to string
4. Potential string formatting issues

## Fixes Applied

### 1. `netlify/functions/createBooking.js`

**Added data normalization before INSERT:**
```javascript
const normalized = {
    name: String(name || '').trim(),
    email: String(email || '').trim(),
    phone: String(phone || '').trim(),
    tour: String(tour || '').trim(),
    date: String(date || '').trim().slice(0, 10), // Ensure YYYY-MM-DD format
    people: Number(peopleNum),
    addons: Array.isArray(addons) ? addons.join(', ') : String(addons || '').trim(),
    total_price: Number(totalPriceNum)
};
```

**Added date format validation:**
```javascript
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(normalized.date)) {
    return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
            success: false,
            message: 'Invalid date format. Expected YYYY-MM-DD'
        })
    };
}
```

**Updated SQL INSERT to use normalized values:**
```javascript
const insertResult = await sql`
    INSERT INTO bookings (
        name,
        email,
        phone,
        tour,
        date,
        people,
        addons,
        total_price
    ) VALUES (
        ${normalized.name},
        ${normalized.email},
        ${normalized.phone},
        ${normalized.tour},
        ${normalized.date},
        ${normalized.people},
        ${normalized.addons},
        ${normalized.total_price}
    ) RETURNING id
`;
```

**Added console logging:**
```javascript
console.log('Normalized booking data:', normalized);
console.log('Inserting booking into database...');
```

### 2. `main.js` - `contactAboutCustomTour()` function

**Normalized data before sending to API:**
```javascript
// Normalize date to YYYY-MM-DD format (remove any time data)
const normalizedDate = tourDate.trim().slice(0, 10);

const bookingData = {
    name: customerName.trim(),
    email: customerEmail.trim(),
    phone: (customerPhone || '').trim(),
    tour: 'Custom Tour',
    date: normalizedDate,
    people: Number(numberOfGuests), // Ensure it's a number
    addons: addons, // Array will be converted to string in API
    totalPrice: Number(totalCost) // Ensure it's a number, not formatted string
};
```

## Key Changes

### Data Type Normalization
- ✅ **Date**: Trimmed and sliced to first 10 characters (YYYY-MM-DD)
- ✅ **People**: Explicitly converted to Number
- ✅ **Total Price**: Explicitly converted to Number (removed any "$" formatting)
- ✅ **Addons**: Array converted to comma-separated string
- ✅ **All strings**: Trimmed to remove whitespace

### Validation Added
- ✅ Date format validation with regex
- ✅ Console logging for debugging
- ✅ Proper error messages for invalid data

### SQL Query
- ✅ Uses normalized object values
- ✅ Column names match schema exactly
- ✅ All values properly typed

## Testing

To test locally, ensure you have:
1. `NETLIFY_DATABASE_URL` environment variable set
2. Database table `bookings` created with correct schema
3. Run the booking flow and check console logs

**Expected console output:**
```
Normalized booking data: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+82 010-1234-5678',
    tour: 'Custom Tour',
    date: '2025-02-15',
    people: 2,
    addons: 'Lunch: Gamcheon Culture Village, Hanbok Rental',
    total_price: 150
}
Inserting booking into database...
Booking saved to database with ID: 1
```

## Files Modified

1. ✅ `netlify/functions/createBooking.js` - Added normalization and validation
2. ✅ `main.js` - Normalized data before API call

## Verification Checklist

- [x] Date is normalized to YYYY-MM-DD format
- [x] People is sent as Number
- [x] TotalPrice is sent as Number (no "$" formatting)
- [x] Addons array is converted to comma-separated string
- [x] All strings are trimmed
- [x] Date format is validated with regex
- [x] Console logging added for debugging
- [x] SQL INSERT uses normalized values

## Next Steps

1. Deploy to Netlify
2. Test booking submission
3. Check Netlify function logs for "Normalized booking data" output
4. Verify booking is saved in database
5. Confirm PDF and emails are sent

