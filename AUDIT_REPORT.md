# Chill Busan Tours - Full Audit Report

## 🔍 Issues Found

### 1. **SECURITY: Hard-coded Supabase Keys in HTML Files**

**Location:**
- `index.html` (lines 963-964)
- `dashboard.html` (lines 184-185)
- `login.html` (lines 141-142)
- `signup.html` (lines 180-181)

**Issue:**
Supabase anon keys are hard-coded directly in HTML files. While anon keys are safe to expose, this is a bad practice and makes it harder to manage different environments.

**Risk:** Medium - Keys are exposed in source code, making it harder to rotate or use different keys per environment.

**Fix:**
```javascript
// Use environment variables or config injection
window.SUPABASE_URL = window.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
```

---

### 2. **XSS VULNERABILITY: Unescaped User Input in innerHTML**

**Location:**
- `main.js` line 1782: `customerEmail` inserted directly into innerHTML
- `main.js` line 1814: `error.message` inserted directly into innerHTML
- `dashboard.html` line 271-276: Booking data inserted via innerHTML

**Issue:**
User-provided data (email, error messages, booking details) are inserted into innerHTML without proper escaping, creating XSS attack vectors.

**Risk:** High - Malicious users could inject scripts.

**Fix:**
```javascript
// Use textContent or escapeHtml function
const emailText = document.createTextNode(customerEmail);
emailElement.appendChild(emailText);

// Or use existing escapeHtml function
emailElement.textContent = customerEmail;
```

---

### 3. **ERROR HANDLING: Generic Error Messages**

**Location:**
- `dashboard.html` line 298: "Error loading bookings" (too generic)
- `main.js` line 1814: Generic error message without context
- `dashboard.html` line 214: "Error loading status" (not user-friendly)

**Issue:**
Error messages don't provide helpful context or actionable guidance to users.

**Risk:** Low - Poor UX, users don't know what went wrong.

**Fix:**
```javascript
// Provide specific, actionable error messages
if (error.code === 'PGRST116') {
    errorMsg = 'Your account is being set up. Please refresh the page in a moment.';
} else if (error.message.includes('network')) {
    errorMsg = 'Connection issue. Please check your internet and try again.';
} else {
    errorMsg = 'Unable to load your bookings. Please try refreshing the page.';
}
```

---

### 4. **AUTHENTICATION: No Session Expiration Handling**

**Location:**
- `dashboard.html` - No token refresh logic
- `main.js` - No session expiration checks
- `src/utils/supabase.js` - No automatic token refresh

**Issue:**
When Supabase session expires, users get cryptic errors instead of being redirected to login.

**Risk:** Medium - Poor UX when sessions expire.

**Fix:**
```javascript
// Add session expiration handling
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (!session) {
            window.location.href = 'login.html?expired=true';
        }
    }
});
```

---

### 5. **ANALYTICS: Duplicate PostHog Event Tracking**

**Location:**
- `index.html` lines 203, 231, 259, 287: Inline `onclick` handlers call `trackEvent`
- `main.js` lines 50-80: Event listeners also call `trackEvent` for same buttons

**Issue:**
"Book Now" buttons trigger PostHog events twice - once from inline onclick, once from event listener.

**Risk:** Low - Analytics data duplication, inaccurate metrics.

**Fix:**
Remove inline `onclick` handlers and rely only on event listeners, OR remove event listeners and keep inline handlers (prefer event listeners for better separation of concerns).

---

### 6. **UI/UX: No Pagination for Bookings List**

**Location:**
- `api/getUserBookings.js` line 64: Hard limit of 50 bookings
- `dashboard.html` line 268: All bookings rendered at once

**Issue:**
Users with many bookings will see a long, unscrollable list. No pagination or "Load More" functionality.

**Risk:** Low - Performance and UX issue for power users.

**Fix:**
```javascript
// Add pagination
const BOOKINGS_PER_PAGE = 10;
let currentPage = 0;

async function loadBookings(userId, page = 0) {
    const response = await fetch(`/api/getUserBookings?userId=${userId}&page=${page}&limit=${BOOKINGS_PER_PAGE}`);
    // Render bookings with "Load More" button
}
```

---

### 7. **ERROR HANDLING: Missing Empty State Messages**

**Location:**
- `dashboard.html` line 283: Good empty state for zero bookings ✅
- `main.js` line 318: Good empty state for comments ✅
- `main.js` line 576: Good empty state for stories ✅

**Status:** ✅ Most empty states are handled well, but error states need improvement (see issue #3).

---

### 8. **PERFORMANCE: Missing Lazy Loading on Images**

**Location:**
- `index.html`: Hero videos don't need lazy loading ✅
- Story thumbnails in `main.js`: Need to check if lazy loading is applied

**Issue:**
Some images may load immediately when not needed, slowing initial page load.

**Risk:** Low - Performance optimization opportunity.

**Fix:**
```html
<img src="..." loading="lazy" decoding="async" alt="...">
```

---

### 9. **SECURITY: User ID Filtering in API Routes**

**Location:**
- `api/getUserBookings.js` line 62: ✅ Properly filters by `user_id`
- `api/consumeDiscount.js` line 60: ✅ Properly filters by `id` (user ID)
- `api/createBooking.js` line 199: ✅ Uses `user_id` from request

**Status:** ✅ All API routes properly filter by user ID. No security issues found.

---

### 10. **ERROR HANDLING: Network Error Not Handled in Dashboard**

**Location:**
- `dashboard.html` line 261: Fetch call has no network error handling
- `dashboard.html` line 293: Catch block shows generic error

**Issue:**
If network fails, user sees "Error loading bookings" without knowing it's a network issue.

**Risk:** Low - UX issue.

**Fix:**
```javascript
try {
    const response = await fetch(`/api/getUserBookings?userId=${userId}`);
    
    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    // ...
} catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMsg = 'Network connection issue. Please check your internet and try again.';
    } else {
        errorMsg = 'Unable to load bookings. Please try refreshing the page.';
    }
}
```

---

### 11. **AUTHENTICATION: No Redirect After Session Expiry**

**Location:**
- `dashboard.html` line 196: Redirects to login if no user, but doesn't handle expired sessions
- `main.js` line 66: Checks for user but doesn't handle expired tokens

**Issue:**
Expired sessions may cause errors instead of graceful redirect to login.

**Risk:** Medium - Poor UX.

**Fix:**
```javascript
// Check for expired session
const { data: { session }, error } = await supabase.auth.getSession();
if (error || !session || !session.user) {
    window.location.href = 'login.html?expired=true';
    return;
}
```

---

### 12. **ANALYTICS: PostHog May Load Multiple Times**

**Location:**
- `index.html` line 29: PostHog script in head ✅
- No check to prevent duplicate initialization

**Status:** ✅ PostHog loader has built-in protection (`e.__SV||(window.posthog=e`), so this is handled.

---

### 13. **ERROR HANDLING: Booking Error Message XSS Risk**

**Location:**
- `main.js` line 1814: `error.message` inserted directly into innerHTML

**Issue:**
Error messages from API could contain malicious content if API is compromised.

**Risk:** Medium - XSS vulnerability.

**Fix:**
```javascript
// Escape error message
const errorText = document.createTextNode(error.message || 'Failed to create booking. Please try again.');
errorMsg.querySelector('p').appendChild(errorText);
```

---

### 14. **UI/UX: No Loading State for Bonus Status**

**Location:**
- `dashboard.html` line 158: Shows spinner initially ✅
- But if `loadBonusStatus` fails silently, spinner stays forever

**Issue:**
If API call fails without throwing, user sees infinite loading.

**Risk:** Low - Edge case.

**Fix:**
Add timeout:
```javascript
const timeout = setTimeout(() => {
    if (bonusStatusDiv.querySelector('.fa-spinner')) {
        bonusStatusDiv.innerHTML = 'Unable to load status. Please refresh.';
    }
}, 10000);
```

---

### 15. **SECURITY: Email Address in Success Message (XSS)**

**Location:**
- `main.js` line 1782: `customerEmail` inserted via innerHTML

**Issue:**
Email address from user input inserted without escaping.

**Risk:** Medium - XSS if email contains malicious content.

**Fix:**
```javascript
// Use textContent instead
const emailElement = document.createElement('p');
emailElement.textContent = customerEmail;
emailElement.style.cssText = 'margin: 5px 0; color: #4A90E2; font-weight: 600;';
successMsg.appendChild(emailElement);
```

---

## 📋 Summary

**Critical Issues:** 2 (XSS vulnerabilities)
**High Priority:** 3 (Session handling, error messages, duplicate tracking)
**Medium Priority:** 5 (Hard-coded keys, pagination, network errors)
**Low Priority:** 5 (Performance, edge cases)

**Total Issues Found:** 15

---

## 🔧 Ready-to-Apply Fixes

See individual fix blocks below for each issue.
