# Dashboard Error Fix - "Cannot coerce to single JSON object"

## Problem
The dashboard was showing the error: "Cannot coerce the result to a single JSON object" when loading welcome bonus status or bookings.

## Root Cause
Supabase queries using `.single()` throw this error when:
- Zero rows are returned
- Multiple rows are returned (unexpected)
- User records don't exist yet

## Solution Applied

### 1. Replaced `.single()` with `.maybeSingle()`
All API handlers now use `.maybeSingle()` which gracefully handles 0 or 1 rows:
- ✅ `api/getUserBookings.js` - Already using array handling (no `.single()` needed)
- ✅ `api/consumeDiscount.js` - Using `.maybeSingle()`
- ✅ `api/createBooking.js` - Using `.maybeSingle()`
- ✅ `api/comments.js` - Using `.maybeSingle()`
- ✅ `src/utils/supabase.js` - Enhanced `getUserDiscountStatus()` with fallback handling

### 2. Added Error Handling for Edge Cases
Enhanced `getUserDiscountStatus()` in `src/utils/supabase.js`:
- Added `.limit(1)` before `.maybeSingle()` to prevent multiple row issues
- Added fallback handling for PGRST116 errors
- Added retry logic with array handling if `.maybeSingle()` fails

### 3. Graceful "No Data" Handling
All API endpoints now return consistent JSON shapes:
- Empty arrays: `{ success: true, bookings: [], status: 'unused' }`
- No user found: `{ success: false, status: 'unused', message: '...' }`

## Files Modified

1. **src/utils/supabase.js** (lines 262-325)
   - Enhanced `getUserDiscountStatus()` with error handling
   - Added `.limit(1)` before `.maybeSingle()`
   - Added fallback for PGRST116 errors

2. **api/getUserBookings.js** (already fixed)
   - Returns `{ success: true, bookings: [] }` for empty results

3. **api/consumeDiscount.js** (already fixed)
   - Uses `.maybeSingle()` and handles null responses

4. **api/createBooking.js** (already fixed)
   - Uses `.maybeSingle()` for discount consumption

5. **api/comments.js** (already fixed)
   - Uses `.maybeSingle()` for comment insertion

## Validation

✅ No `.single()` calls remain in API handlers
✅ All queries use `.maybeSingle()` or array handling
✅ All endpoints return consistent JSON shapes
✅ Error messages are user-friendly
✅ No duplicate users found in database

## Testing Checklist

- [x] User with no bookings → Shows "You haven't booked any tours yet"
- [x] User with bookings → Shows booking list
- [x] User with no discount record → Shows discount as available
- [x] User with expired discount → Shows "Discount Used or Expired"
- [x] User with active discount → Shows discount with expiry date
- [x] Error handling → Shows friendly messages instead of technical errors

## Status: ✅ Fixed

The dashboard error should no longer appear. All queries now handle edge cases gracefully.
