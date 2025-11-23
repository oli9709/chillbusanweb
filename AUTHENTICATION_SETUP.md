# Authentication & Welcome Discount Setup

## Overview

This project uses Supabase for authentication and includes a welcome discount system that provides 10% off the first booking for new users.

## Environment Variables

### Required for Supabase Authentication

Add these environment variables in your Netlify dashboard:

1. **SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://your-project-id.supabase.co`
   - Find it in: Supabase Dashboard → Settings → API → Project URL

2. **SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Find it in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY** (Optional - for server-side operations)
   - Your Supabase service role key (keep this secret!)
   - Only use in Netlify Functions if needed for admin operations
   - Find it in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`

### Setting Environment Variables in Netlify

1. Go to Netlify Dashboard
2. Select your site
3. Go to **Site Settings** → **Environment Variables**
4. Add each variable:
   - Key: `SUPABASE_URL`
   - Value: `https://your-project-id.supabase.co`
   - Repeat for `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (if needed)

### Setting Environment Variables for Local Development

Create a `.env` file in the project root (do NOT commit this file):

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Database Setup

### 1. Run Migration

Execute the migration file to create the `users` table:

```sql
-- File: db/migrations/2025_11_create_users_table.sql
```

Run this in your Supabase SQL Editor or Neon database.

### 2. Enable Row Level Security (RLS) in Supabase

In Supabase Dashboard → Authentication → Policies:

- Allow users to read their own data
- Allow users to update their own discount status

Example policy:
```sql
-- Allow users to read their own user record
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own discount status
CREATE POLICY "Users can update own discount"
ON users FOR UPDATE
USING (auth.uid() = id);
```

## Pages Created

### 1. `/signup.html`
- User registration page
- Includes welcome bonus notification
- Redirects to login after successful signup

### 2. `/login.html`
- User login page
- Forgot password functionality
- Redirects to dashboard after successful login

### 3. `/dashboard.html`
- User dashboard showing:
  - Welcome bonus status
  - My Bookings list
  - Sign out button

## Integration Points

### Booking Flow Integration

The booking flow in `main.js` now:
1. Checks if user is authenticated
2. Checks if user has available discount
3. Applies 10% discount if available
4. Passes `userId` and `applyDiscount` to booking API

### Booking API Integration

The `createBooking.js` function:
1. Accepts `userId` and `applyDiscount` parameters
2. Applies 10% discount to total price if requested
3. Consumes discount after successful booking
4. Includes discount info in confirmation emails

## Testing Steps

### 1. Test Signup
1. Navigate to `/signup.html`
2. Fill in form with test email
3. Verify account creation
4. Check email for verification link (if email confirmation enabled)

### 2. Test Login
1. Navigate to `/login.html`
2. Sign in with created account
3. Verify redirect to dashboard

### 3. Test Dashboard
1. Verify welcome bonus shows as "Available"
2. Check that discount expiry date is displayed
3. Verify bookings list (should be empty for new user)

### 4. Test Discount Application
1. Create a booking while logged in
2. Verify discount is applied (10% off)
3. Check confirmation email shows discount
4. Verify dashboard shows discount as "Used" after booking

### 5. Test Booking Without Discount
1. Sign out and create booking as guest
2. Verify no discount is applied
3. Sign in and create another booking
4. Verify discount is not applied (already used)

## Files Modified/Created

### New Files
- `db/migrations/2025_11_create_users_table.sql` - Database migration
- `src/utils/supabase.js` - Supabase client and auth functions
- `signup.html` - Signup page
- `login.html` - Login page
- `dashboard.html` - User dashboard
- `netlify/functions/getUserBookings.js` - Get user bookings
- `netlify/functions/consumeDiscount.js` - Consume discount (placeholder)

### Modified Files
- `main.js` - Added discount check and application
- `netlify/functions/createBooking.js` - Added discount logic
- `utils/bookingAPI.js` - Already supports passing userId and applyDiscount

## Next Steps

1. **Set up Supabase project** if not already done
2. **Add environment variables** to Netlify
3. **Run database migration** to create users table
4. **Configure RLS policies** in Supabase
5. **Test authentication flow** end-to-end
6. **Test discount application** in booking flow

## Troubleshooting

### "Supabase client not initialized"
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Verify values are correct (no extra spaces)
- Check browser console for errors

### "Discount not applying"
- Verify user is logged in
- Check `getUserDiscountStatus` returns `hasDiscount: true`
- Verify discount hasn't expired
- Check that discount wasn't already used

### "Cannot read bookings"
- Verify `getUserBookings` function is deployed
- Check that bookings table has matching email
- Verify user authentication is working

