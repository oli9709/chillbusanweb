# Custom Tour Email Templates - Summary

## ✅ Implementation Complete

### Email Templates Created

All email templates are centralized in `/utils/customTourEmailTemplates.js` with reusable functions:

1. **Custom Tour Request Received** (Admin Notification)
   - Sent when: New custom tour request is created (pay-now or reserve)
   - Recipient: Admin email
   - Includes: Full tour details, user info, payment status

2. **Custom Tour Approved** (Customer Notification)
   - Sent when: Admin approves a custom tour request
   - Recipient: Customer email
   - Includes: Tour details, next steps, dashboard link

3. **Custom Tour Rejected** (Customer Notification)
   - Sent when: Admin rejects a custom tour request
   - Recipient: Customer email
   - Includes: Rejection reason (optional), suggestions for alternatives

4. **Payment Received** (Customer Confirmation)
   - Sent when: Stripe payment succeeds for custom tour
   - Recipient: Customer email + Admin email
   - Includes: Payment confirmation, tour details, dashboard link

5. **Custom Tour Cancelled** (Customer Notification)
   - Sent when: Payment is refunded or tour is cancelled
   - Recipient: Customer email
   - Includes: Cancellation reason, refund information

---

## 📧 Email Template Features

### Design
- Professional HTML templates with inline CSS
- Responsive design (max-width: 600px)
- Color-coded headers by event type:
  - Request Received: Blue gradient
  - Approved: Green gradient
  - Rejected: Red gradient
  - Payment Received: Green gradient
  - Cancelled: Gray gradient

### Content
- Personalized greetings (uses user name or email)
- Complete tour information:
  - Tour ID
  - Date & Time
  - Duration
  - Travelers count
  - Selected locations (with friendly names)
  - Add-ons (if any)
  - Total price (USD)
- Action buttons/links to dashboard
- Contact information
- Professional footer

---

## 🔧 Usage

### Import the utility
```javascript
import { sendCustomTourEmail } from '../../utils/customTourEmailTemplates.js';
```

### Send an email
```javascript
await sendCustomTourEmail(
    to,                    // Recipient email
    template,              // 'request_received' | 'approved' | 'rejected' | 'payment_received' | 'cancelled'
    tourRequest,           // Custom tour request object
    userEmail,             // User email (optional)
    userName,              // User name (optional)
    additionalData         // { reason?, paymentIntentId? }
);
```

### Example
```javascript
// Send approval email
await sendCustomTourEmail(
    userEmail,
    'approved',
    tourRequest,
    userEmail,
    userName
);

// Send rejection email with reason
await sendCustomTourEmail(
    userEmail,
    'rejected',
    tourRequest,
    userEmail,
    userName,
    { reason: 'Dates not available' }
);

// Send payment confirmation
await sendCustomTourEmail(
    userEmail,
    'payment_received',
    tourRequest,
    userEmail,
    userName,
    { paymentIntentId: 'pi_xxx' }
);
```

---

## 📁 Files Updated

### 1. `utils/customTourEmailTemplates.js` - NEW
- Centralized email template utility
- 5 template functions
- Helper functions for formatting
- `sendCustomTourEmail()` function

### 2. `api/custom/pay-now.js` - MODIFIED
- Uses `sendCustomTourEmail()` for request received notification
- Removed inline email code

### 3. `api/custom/reserve.js` - MODIFIED
- Uses `sendCustomTourEmail()` for request received notification
- Removed inline email code

### 4. `api/admin/custom-tours/[id]/approve.js` - MODIFIED
- Uses `sendCustomTourEmail()` for approval notification
- Removed inline email code

### 5. `api/admin/custom-tours/[id]/reject.js` - MODIFIED
- Uses `sendCustomTourEmail()` for rejection notification
- Removed inline email code

### 6. `api/stripe/webhook.js` - MODIFIED
- Uses `sendCustomTourEmail()` for payment received notification
- Uses `sendCustomTourEmail()` for cancellation notification
- Removed inline email code

---

## ✅ Environment Variables

Uses existing SMTP configuration:
- `EMAIL_HOST` (default: smtp.gmail.com)
- `EMAIL_PORT` (default: 587)
- `EMAIL_USER` (default: chilltours.official@gmail.com)
- `EMAIL_PASS` or `EMAIL_APP_PASSWORD`
- `ADMIN_EMAIL` (default: chilltours.official@gmail.com)
- `BASE_URL` (default: https://chillbusantours.com)

---

## 🎨 Template Structure

All templates follow this structure:
- HTML email with inline CSS
- Responsive container (600px max-width)
- Color-coded header section
- Information box with tour details
- Action buttons/links
- Professional footer

---

## 📝 Notes

- All templates include both HTML and plain text versions
- Email sending failures don't break the main flow
- Templates automatically format location and addon names
- Prices are displayed in USD
- Dates are formatted in a user-friendly format
- All templates include dashboard links where appropriate

