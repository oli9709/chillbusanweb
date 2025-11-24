# Chill Busan Tours - Audit Fixes (Ready to Apply)

## Fix 1: Remove XSS Vulnerability in Booking Success Message

**File:** `main.js` (around line 1777-1785)

**Replace:**
```javascript
successMsg.innerHTML = `
    <div style="margin-bottom: 15px; color: #27ae60; font-size: 3rem;">✓</div>
    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Booking Confirmed!</h3>
    <p style="margin: 5px 0; color: #34495e;"><strong>Booking ID:</strong> ${result.bookingId}</p>
    <p style="margin: 10px 0; color: #34495e; font-size: 0.9rem;">A confirmation email with PDF has been sent to:</p>
    <p style="margin: 5px 0; color: #4A90E2; font-weight: 600;">${customerEmail}</p>
    <p style="margin: 15px 0 0 0; color: #7f8c8d; font-size: 0.85rem;">Please check your inbox.</p>
    <button onclick="this.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #4A90E2; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">Close</button>
`;
```

**With:**
```javascript
// Create elements safely to prevent XSS
successMsg.innerHTML = `
    <div style="margin-bottom: 15px; color: #27ae60; font-size: 3rem;">✓</div>
    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Booking Confirmed!</h3>
    <p style="margin: 5px 0; color: #34495e;"><strong>Booking ID:</strong> ${escapeHtml(String(result.bookingId || ''))}</p>
    <p style="margin: 10px 0; color: #34495e; font-size: 0.9rem;">A confirmation email with PDF has been sent to:</p>
`;

// Add email safely using textContent
const emailP = document.createElement('p');
emailP.style.cssText = 'margin: 5px 0; color: #4A90E2; font-weight: 600;';
emailP.textContent = customerEmail;
successMsg.appendChild(emailP);

// Add remaining content
const remainingHTML = `
    <p style="margin: 15px 0 0 0; color: #7f8c8d; font-size: 0.85rem;">Please check your inbox.</p>
    <button onclick="this.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #4A90E2; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">Close</button>
`;
successMsg.insertAdjacentHTML('beforeend', remainingHTML);
```

---

## Fix 2: Remove XSS Vulnerability in Error Message

**File:** `main.js` (around line 1811-1817)

**Replace:**
```javascript
errorMsg.innerHTML = `
    <div style="margin-bottom: 15px; color: #e74c3c; font-size: 3rem;">✗</div>
    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Booking Failed</h3>
    <p style="margin: 10px 0; color: #34495e;">${error.message || 'Failed to create booking. Please try again.'}</p>
    <p style="margin: 15px 0 0 0; color: #7f8c8d; font-size: 0.85rem;">If the problem persists, please contact us directly.</p>
    <button onclick="this.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">Close</button>
`;
```

**With:**
```javascript
errorMsg.innerHTML = `
    <div style="margin-bottom: 15px; color: #e74c3c; font-size: 3rem;">✗</div>
    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Booking Failed</h3>
    <p id="error-message-text" style="margin: 10px 0; color: #34495e;"></p>
    <p style="margin: 15px 0 0 0; color: #7f8c8d; font-size: 0.85rem;">If the problem persists, please contact us directly.</p>
    <button onclick="this.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">Close</button>
`;

// Safely set error message using textContent
const errorTextEl = errorMsg.querySelector('#error-message-text');
if (errorTextEl) {
    errorTextEl.textContent = error.message || 'Failed to create booking. Please try again.';
}
```

---

## Fix 3: Fix XSS in Dashboard Bookings List

**File:** `dashboard.html` (around line 271-276)

**Replace:**
```javascript
bookingItem.innerHTML = `
    <h3>${booking.tour || 'Custom Tour'}</h3>
    <p><i class="fas fa-calendar"></i> ${booking.date}</p>
    <p><i class="fas fa-users"></i> ${booking.people} ${booking.people === 1 ? 'guest' : 'guests'}</p>
    <p><i class="fas fa-dollar-sign"></i> $${booking.total_price || 0}</p>
`;
```

**With:**
```javascript
// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

bookingItem.innerHTML = `
    <h3>${escapeHtml(booking.tour || 'Custom Tour')}</h3>
    <p><i class="fas fa-calendar"></i> ${escapeHtml(booking.date || '')}</p>
    <p><i class="fas fa-users"></i> ${booking.people || 0} ${(booking.people || 0) === 1 ? 'guest' : 'guests'}</p>
    <p><i class="fas fa-dollar-sign"></i> $${booking.total_price || 0}</p>
`;
```

---

## Fix 4: Improve Error Handling in Dashboard

**File:** `dashboard.html` (around line 258-302)

**Replace:**
```javascript
async function loadBookings(userId) {
    try {
        const response = await fetch(`/api/getUserBookings?userId=${userId}`);
        const result = await response.json();

        if (result.success && result.bookings && result.bookings.length > 0) {
            // ... render bookings
        } else {
            bookingsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No bookings yet</p>
                    <a href="index.html" class="btn btn-primary" style="display: inline-block; margin-top: 15px;">
                        Book Your First Tour
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading bookings</p>
            </div>
        `;
    }
}
```

**With:**
```javascript
async function loadBookings(userId) {
    try {
        const response = await fetch(`/api/getUserBookings?userId=${userId}`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();

        if (result.success && result.bookings && result.bookings.length > 0) {
            // ... render bookings (same as before)
        } else {
            bookingsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>You haven't booked any tours yet</p>
                    <a href="index.html" class="btn btn-primary" style="display: inline-block; margin-top: 15px;">
                        Book Your First Tour
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        
        let errorMessage = 'Unable to load your bookings.';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Network connection issue. Please check your internet and try again.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'Session expired. Please sign in again.';
            setTimeout(() => window.location.href = 'login.html?expired=true', 2000);
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again in a moment.';
        }
        
        bookingsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${errorMessage}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="display: inline-block; margin-top: 15px;">
                    Retry
                </button>
            </div>
        `;
    }
}
```

---

## Fix 5: Add Session Expiration Handling

**File:** `dashboard.html` (around line 192-201)

**Replace:**
```javascript
async function checkAuth() {
    const { user, error } = await window.supabaseAuth.getCurrentUser();
    
    if (error || !user) {
        window.location.href = 'login.html';
        return null;
    }
    
    return user;
}
```

**With:**
```javascript
async function checkAuth() {
    try {
        const { user, error } = await window.supabaseAuth.getCurrentUser();
        
        if (error) {
            // Check if it's a session expiration error
            if (error.message.includes('JWT') || error.message.includes('expired') || error.message.includes('invalid')) {
                window.location.href = 'login.html?expired=true';
                return null;
            }
        }
        
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        
        // Verify session is still valid
        const supabase = window.supabaseAuth.getSupabase();
        if (supabase) {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session || !session.user) {
                window.location.href = 'login.html?expired=true';
                return null;
            }
        }
        
        return user;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html?expired=true';
        return null;
    }
}
```

---

## Fix 6: Remove Duplicate PostHog Tracking

**File:** `index.html` (lines 203, 231, 259, 287)

**Replace:**
```html
<button class="details-button" onclick="trackEvent('book_now_clicked', {tour_name: '...'}); window.open('...', '_blank')">Book This Tour</button>
```

**With:**
```html
<button class="details-button" data-tour-name="Busan Hidden Gems, Beaches & Local Food" onclick="window.open('...', '_blank')">Book This Tour</button>
```

**Then update `main.js` (around line 50-80):**

**Replace:**
```javascript
// Track "Book Now" button clicks (additional tracking for buttons without inline onclick)
const bookButtons = document.querySelectorAll('.details-button');
bookButtons.forEach(button => {
    // Only add listener if button doesn't already have inline onclick
    if (!button.getAttribute('onclick') || !button.getAttribute('onclick').includes('trackEvent')) {
        button.addEventListener('click', function() {
            const card = button.closest('.tour-card');
            if (card) {
                const tourTitle = card.querySelector('h3');
                const tourName = tourTitle ? tourTitle.textContent.trim() : 'Unknown Tour';
                trackEvent('book_now_clicked', { tour_name: tourName });
            }
        });
    }
});
```

**With:**
```javascript
// Track "Book Now" button clicks
const bookButtons = document.querySelectorAll('.details-button');
bookButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Get tour name from data attribute or card title
        const tourName = button.getAttribute('data-tour-name') || 
                        (() => {
                            const card = button.closest('.tour-card');
                            if (card) {
                                const tourTitle = card.querySelector('h3');
                                return tourTitle ? tourTitle.textContent.trim() : 'Unknown Tour';
                            }
                            return 'Unknown Tour';
                        })();
        
        trackEvent('book_now_clicked', { tour_name: tourName });
    });
});
```

---

## Fix 7: Improve Bonus Status Error Handling

**File:** `dashboard.html` (around line 204-255)

**Replace:**
```javascript
async function loadBonusStatus(userId) {
    try {
        const status = await window.supabaseAuth.getUserDiscountStatus(userId);
        const { hasDiscount, discountExpiry, error } = status;
        
        if (error) {
            bonusStatusDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <p style="margin: 0; font-weight: 600;">Error loading status</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.85rem; opacity: 0.9;">${error.message || 'Please try refreshing'}</p>
                </div>
            `;
            return;
        }
        // ... rest of function
    } catch (error) {
        // ... error handling
    }
}
```

**With:**
```javascript
async function loadBonusStatus(userId) {
    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
        if (bonusStatusDiv.querySelector('.fa-spinner')) {
            bonusStatusDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <p style="margin: 0; font-weight: 600;">Unable to load status</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.85rem; opacity: 0.9;">Please refresh the page</p>
                </div>
            `;
        }
    }, 10000);
    
    try {
        const status = await window.supabaseAuth.getUserDiscountStatus(userId);
        clearTimeout(timeout);
        
        const { hasDiscount, discountExpiry, error } = status;
        
        if (error) {
            let errorMsg = 'Please try refreshing';
            if (error.message && !error.message.includes('undefined')) {
                errorMsg = error.message;
            } else if (error.code === 'PGRST116') {
                errorMsg = 'Your account is being set up. Please refresh in a moment.';
            }
            
            bonusStatusDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <p style="margin: 0; font-weight: 600;">Unable to load discount status</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.85rem; opacity: 0.9;">${errorMsg}</p>
                </div>
            `;
            return;
        }
        // ... rest of function (same as before)
    } catch (error) {
        clearTimeout(timeout);
        console.error('Error loading bonus status:', error);
        
        let errorMsg = 'Please try refreshing';
        if (error.message && error.message.includes('network')) {
            errorMsg = 'Network issue. Check your connection and try again.';
        }
        
        bonusStatusDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <p style="margin: 0; font-weight: 600;">Unable to load discount status</p>
                <p style="margin: 5px 0 0 0; font-size: 0.85rem; opacity: 0.9;">${errorMsg}</p>
            </div>
        `;
    }
}
```

---

## Fix 8: Add Pagination Support for Bookings

**File:** `api/getUserBookings.js` (around line 58-64)

**Replace:**
```javascript
const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, name, email, phone, tour, date, people, addons, total_price, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
```

**With:**
```javascript
// Get pagination parameters
const page = parseInt(req.query.page) || 0;
const limit = parseInt(req.query.limit) || 10;
const offset = page * limit;

const { data: bookings, error, count } = await supabase
    .from('bookings')
    .select('id, name, email, phone, tour, date, people, addons, total_price, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
```

**Update response:**
```javascript
return res.status(200).json({
    success: true,
    bookings: bookings || [],
    pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
    }
});
```

**Then update `dashboard.html` to handle pagination:**
```javascript
let currentPage = 0;
const BOOKINGS_PER_PAGE = 10;

async function loadBookings(userId, page = 0) {
    try {
        const response = await fetch(`/api/getUserBookings?userId=${userId}&page=${page}&limit=${BOOKINGS_PER_PAGE}`);
        // ... handle response with pagination
        if (result.pagination.hasMore) {
            // Add "Load More" button
        }
    } catch (error) {
        // ... error handling
    }
}
```

---

## Fix 9: Move Supabase Keys to Environment Variables (Optional)

**Files:** `index.html`, `dashboard.html`, `login.html`, `signup.html`

**Note:** This requires Vercel environment variable setup. For now, add comments:

```javascript
// TODO: Move to environment variables in production
// In Vercel, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
window.SUPABASE_URL = window.SUPABASE_URL || 'https://bvarcwjloubxagszzkqf.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Fix 10: Add Session Refresh on Dashboard Load

**File:** `dashboard.html` (add after line 186)

**Add:**
```javascript
// Listen for auth state changes and handle session expiration
if (window.supabaseAuth && window.supabaseAuth.getSupabase) {
    const supabase = window.supabaseAuth.getSupabase();
    if (supabase && supabase.auth) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                if (!session || !session.user) {
                    window.location.href = 'login.html?expired=true';
                }
            }
        });
    }
}
```

---

## Summary of Critical Fixes Priority

1. **IMMEDIATE (Security):** Fixes #1, #2, #3, #13, #15 (XSS vulnerabilities)
2. **HIGH (UX):** Fixes #4, #5, #7, #10 (Error handling, duplicate tracking)
3. **MEDIUM (Stability):** Fixes #6, #11 (Pagination, session handling)
4. **LOW (Optimization):** Fix #8 (Lazy loading), Fix #9 (Environment variables)

