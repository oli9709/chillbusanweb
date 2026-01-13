# Safe Delete List - Phase 1 Cleanup

## ⚠️ IMPORTANT: DO NOT DELETE AUTOMATICALLY
This document lists files that can be safely deleted after verification. Review each file's usage before deletion.

---

## 🗑️ CATEGORY 1: Legacy API Endpoints (REPLACED)

### Files to DELETE:

#### 1. `api/createBooking.js` (468 lines)
**Status:** ✅ SAFE TO DELETE
**Reason:** Replaced by `api/bookings/create.js`
**Evidence:**
- Old schema: stores `name`, `email`, `phone` directly in bookings table
- New schema: uses `user_id` with separate `users` table
- Frontend uses: `components/bookingModal.js` calls `/api/bookings/create` (line 280)
- Legacy usage: `utils/bookingAPI.js` still references it (line 21), but this file should also be cleaned
- Legacy usage: `main.js` references `createBooking()` function (line 1818), but uses the function from `utils/bookingAPI.js`

**Action Required:**
1. Update `utils/bookingAPI.js` to remove `createBooking()` function or update to use `/api/bookings/create`
2. Check `main.js` line 1818 - verify it's not breaking anything
3. Then delete `api/createBooking.js`

---

#### 2. `api/getUserBookings.js` (97 lines)
**Status:** ✅ SAFE TO DELETE
**Reason:** Replaced by `api/users/[id]/bookings.js`
**Evidence:**
- Old endpoint: `GET /api/getUserBookings?userId=xxx`
- New endpoint: `GET /api/users/:id/bookings`
- Frontend uses: `dashboard.html` calls `/api/users/${userId}/bookings` (line 642)
- Legacy references: Only in documentation files (AUDIT_REPORT.md, AUDIT_FIXES.md, VERCEL_MIGRATION_COMPLETE.md)

**Action Required:**
1. Verify no other frontend code calls `/api/getUserBookings`
2. Then delete `api/getUserBookings.js`

---

#### 3. `api/bookingConfirmation.js` (179 lines)
**Status:** ⚠️ REVIEW BEFORE DELETING
**Reason:** Uses different PDF generator (`generateTourPDF` vs `generateBookingPDF`)
**Evidence:**
- Uses `generateTourPDF` (different from `generateBookingPDF` used in current system)
- Sends email with PDF attachment
- Legacy usage: `utils/bookingAPI.js` references it (line 75)
- Current system: Email confirmation sent via `api/stripe/webhook.js` (lines 521-594)
- Current system: PDF download via `api/bookings/[id]/download-pdf.js` uses `generateBookingPDF`

**Note:** Two different PDF generators exist:
- `utils/generateTourPDF.js` - Used by this legacy endpoint
- `utils/generateBookingPDF.js` - Used by current booking system

**Action Required:**
1. Check if `generateTourPDF` is used anywhere else
2. Verify if any active code path calls `/api/bookingConfirmation`
3. If `generateTourPDF` is only used here and endpoint is unused, delete both
4. If used, document why and keep it

---

#### 4. `api/consumeDiscount.js` (99 lines)
**Status:** ⚠️ KEEP FOR NOW (needs integration)
**Reason:** Discount consumption NOT integrated into new booking endpoint
**Evidence:**
- Purpose: Marks `first_booking_discount: false` for a user
- Old implementation: Discount consumption happens in `api/createBooking.js` (lines 252-273)
- New implementation: `api/bookings/create.js` does NOT consume discount (verified - no matches found)
- Alternative: `src/utils/supabase.js` has `consumeDiscount()` function (line 362) - frontend utility
- References: Only in documentation files

**Action Required:**
1. **INTEGRATE** discount consumption into `api/bookings/create.js` OR
2. **INTEGRATE** discount consumption into `api/stripe/webhook.js` (when payment succeeds)
3. After integration, delete `api/consumeDiscount.js`
4. Update any frontend code that calls `/api/consumeDiscount` to use integrated flow

---

## 🗑️ CATEGORY 2: Legacy Netlify Functions (ENTIRE DIRECTORY)

### Directory to DELETE:

#### `netlify/functions/` (entire directory)
**Status:** ✅ SAFE TO DELETE
**Reason:** Project migrated to Vercel, Netlify functions are obsolete
**Contents:**
- `netlify/functions/bookingConfirmation.js`
- `netlify/functions/comments.js`
- `netlify/functions/consumeDiscount.js`
- `netlify/functions/createBooking.js`
- `netlify/functions/getUserBookings.js`
- `netlify/functions/stories.js`
- `netlify/functions/node_modules/`
- `netlify/functions/package-lock.json`

**Evidence:**
- All functions have been migrated to `/api/` directory
- `VERCEL_MIGRATION_COMPLETE.md` documents the migration
- `netlify.toml` may still exist but functions are not used

**Action Required:**
1. Verify `netlify.toml` is not needed for any other purpose
2. Delete entire `netlify/functions/` directory
3. Consider deleting `netlify.toml` if not needed

---

## 🗑️ CATEGORY 3: Test Files (OPTIONAL - Keep for Development)

### Files to DELETE (or move to `/tests/`):

#### 1. `test-sentry.js` (70 lines)
**Status:** ⚠️ OPTIONAL - Keep for development
**Reason:** Test script for Sentry integration
**Action:** Move to `__tests__/` or delete if not needed

#### 2. `api/sentry-test.js` (138 lines)
**Status:** ⚠️ OPTIONAL - Keep for development
**Reason:** API endpoint for testing Sentry
**Action:** Keep if useful for debugging, or delete

#### 3. `utils/testPDF.js` (64 lines)
**Status:** ⚠️ OPTIONAL - Keep for development
**Reason:** Test script for PDF generation
**Action:** Move to `__tests__/` or delete if not needed

#### 4. `sentry-test.html` (unknown lines)
**Status:** ⚠️ OPTIONAL - Keep for development
**Reason:** HTML page for testing Sentry
**Action:** Keep if useful for debugging, or delete

---

## 🗑️ CATEGORY 4: Backup Files

### Files to DELETE:

#### 1. `chill-busan-tours/src/App.jsx.backup`
**Status:** ✅ SAFE TO DELETE
**Reason:** Backup file, not used in production
**Action:** Delete immediately

---

## 🗑️ CATEGORY 5: Frontend Utility Files (NEEDS UPDATE)

### Files to UPDATE (not delete):

#### 1. `utils/bookingAPI.js` (117 lines)
**Status:** ⚠️ UPDATE REQUIRED (do not delete)
**Reason:** Uses legacy endpoints
**Issues:**
- Line 21: Calls `/api/createBooking` (legacy)
- Line 75: Calls `/api/bookingConfirmation` (legacy)
- Exports `createBooking()` and `sendBookingConfirmation()` functions

**Action Required:**
1. Update `createBooking()` to use `/api/bookings/create`
2. Remove or update `sendBookingConfirmation()` (check if still needed)
3. Update function signatures to match new API structure
4. Verify `main.js` usage (line 1818) still works after update

---

## ✅ CATEGORY 6: Files to KEEP (Still in Use)

### Files NOT to delete:

#### 1. `api/comments.js` (155 lines)
**Status:** ✅ KEEP - Still in use
**Evidence:**
- Used in `main.js` (lines 307, 343)
- Used in `test-comments.html`
- Used in `debug-comments.js`
- Active feature

#### 2. `api/stories.js` (89 lines)
**Status:** ✅ KEEP - Still in use
**Evidence:**
- Used in `main.js` (line 673)
- Returns stories from `/data/stories.json`
- Active feature

---

## 📋 SUMMARY: Files to Delete

### High Priority (Safe to Delete):
1. ✅ `api/createBooking.js` - **AFTER** updating `utils/bookingAPI.js`
2. ✅ `api/getUserBookings.js` - Safe to delete immediately
3. ✅ `netlify/functions/` - Entire directory
4. ✅ `chill-busan-tours/src/App.jsx.backup` - Backup file

### Medium Priority (Review First):
1. ⚠️ `api/bookingConfirmation.js` - Verify if still needed (uses different PDF generator)
2. ⚠️ `api/consumeDiscount.js` - **KEEP FOR NOW** - Needs integration into new booking flow first

### Low Priority (Optional):
1. ⚠️ `test-sentry.js` - Move to tests or delete
2. ⚠️ `api/sentry-test.js` - Keep if useful for debugging
3. ⚠️ `utils/testPDF.js` - Move to tests or delete
4. ⚠️ `sentry-test.html` - Keep if useful for debugging

### Files to Update (Not Delete):
1. ⚠️ `utils/bookingAPI.js` - Update to use new endpoints

---

## 🔍 Verification Checklist

Before deleting any file, verify:

- [ ] No active frontend code calls the endpoint
- [ ] No other backend files import/require the file
- [ ] Documentation has been updated
- [ ] Test files have been updated
- [ ] No references in `main.js`, `dashboard.html`, or other frontend files
- [ ] Git history is preserved (files are in version control)

---

## 📝 Notes

### Duplicate Endpoints:
- `POST /api/createBooking` (legacy) vs `POST /api/bookings/create` (current)
- `GET /api/getUserBookings` (legacy) vs `GET /api/users/:id/bookings` (current)

### Environment Variable Access:
Some files use direct `process.env` instead of `utils/env.js`:
- `api/createBooking.js` - Uses `process.env` directly
- `api/consumeDiscount.js` - Uses `process.env` directly
- `api/getUserBookings.js` - Uses `process.env` directly
- `api/bookingConfirmation.js` - Uses `process.env` directly

These will be cleaned up when files are deleted/updated.

---

## 🚀 Next Steps

1. **Review** this list and verify each file's status
2. **Update** `utils/bookingAPI.js` first
3. **Delete** high-priority files one by one
4. **Test** after each deletion to ensure nothing breaks
5. **Update** documentation to remove references to deleted files

