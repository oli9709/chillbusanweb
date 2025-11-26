# Admin Custom Tours Tab - Summary

## ✅ Implementation Complete

### Features Added

1. **Tab Navigation**
   - Added "Bookings", "Custom Tours", and "Refunds" tabs
   - Tab switching with active state
   - Each tab loads its respective data

2. **Custom Tours Tab**
   - Table listing all custom tour requests
   - Columns: ID, User, Date, Total Price, Status, Actions
   - Status filter dropdown
   - Real-time data loading

3. **Action Buttons**

   **For Pending/Approved Tours:**
   - "Approve" button → Approves tour and sends email
   - "Reject" button → Opens modal, rejects tour and sends email
   - "Modify Price" button → Opens modal, updates price and sends email

   **For Paid Tours:**
   - Shows "Paid" status (no actions)

   **For Rejected/Cancelled Tours:**
   - Shows "No actions available"

---

## 📁 Files Created/Modified

### 1. `api/admin/custom-tours.js` - NEW
- GET endpoint to fetch all custom tours for admin
- Supports status filtering
- Returns tours with user information

### 2. `api/admin/custom-tours/[id]/approve.js` - NEW
- POST endpoint to approve custom tour
- Updates status to 'approved'
- Sends approval email to user

### 3. `api/admin/custom-tours/[id]/reject.js` - NEW
- POST endpoint to reject custom tour
- Updates status to 'rejected'
- Sends rejection email with optional reason

### 4. `api/admin/custom-tours/[id]/modify-price.js` - NEW
- POST endpoint to modify custom tour price
- Updates totalPrice in database
- Sends price modification email to user

### 5. `admin.html` - MODIFIED
- Added tab navigation UI
- Added Custom Tours tab content
- Added modals for Reject and Modify Price
- Added JavaScript functions:
  - `switchTab()`
  - `loadCustomTours()`
  - `renderCustomTours()`
  - `getCustomTourStatusBadge()`
  - `approveCustomTour()`
  - `openRejectModal()` / `closeRejectModal()` / `confirmReject()`
  - `openModifyPriceModal()` / `closeModifyPriceModal()` / `confirmModifyPrice()`

---

## 🎨 Custom Tours Table Structure

```html
<table class="custom-tours-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>User</th>
      <th>Date</th>
      <th>Total Price</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {custom tour rows}
  </tbody>
</table>
```

---

## 📧 Email Notifications

### Approval Email
- Subject: "Your Custom Tour Request Has Been Approved!"
- Includes: Tour ID, Date & Time, Duration, Travelers, Locations, Total Price
- Link to dashboard

### Rejection Email
- Subject: "Update on Your Custom Tour Request"
- Includes: Tour ID, Rejection reason (if provided)
- Suggestions for next steps

### Price Modification Email
- Subject: "Price Update for Your Custom Tour Request"
- Includes: Previous price, New price, Price change amount
- Link to dashboard

---

## 🔗 API Endpoints

### GET /api/admin/custom-tours?email={email}&status={status}
Returns all custom tour requests (filtered by status if provided).

**Response:**
```json
{
  "success": true,
  "customTours": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "date": "2025-02-01T09:00:00",
      "totalPrice": 32500,
      "status": "pending",
      "createdAt": "2025-01-01T00:00:00",
      "itinerary": {...},
      "travelers": 4,
      "durationHours": 6,
      "addons": [...]
    }
  ]
}
```

### POST /api/admin/custom-tours/:id/approve?email={email}
Approves a custom tour request.

**Response:**
```json
{
  "success": true,
  "message": "Tour approved successfully"
}
```

### POST /api/admin/custom-tours/:id/reject?email={email}
Rejects a custom tour request.

**Body:**
```json
{
  "reason": "Optional rejection reason"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tour rejected successfully"
}
```

### POST /api/admin/custom-tours/:id/modify-price?email={email}
Modifies the price of a custom tour request.

**Body:**
```json
{
  "newPrice": 250.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Price updated successfully",
  "oldPrice": 32500,
  "newPrice": 25000
}
```

---

## ✅ Status Badge Colors

- **Pending:** Yellow (#fff3cd)
- **Approved:** Blue (#d1ecf1)
- **Rejected:** Red (#f8d7da)
- **Paid:** Green (#d4edda)
- **Cancelled:** Red (#f8d7da)

---

## 🎯 Approval Flow

1. Admin views Custom Tours tab
2. Admin sees pending/approved tours with action buttons
3. Admin clicks "Approve" → Tour status updated → Email sent to user
4. Admin clicks "Reject" → Modal opens → Admin enters reason → Tour status updated → Email sent to user
5. Admin clicks "Modify Price" → Modal opens → Admin enters new price → Price updated → Email sent to user

---

## 📝 Notes

- All actions require admin authentication (email check)
- All actions send email notifications to users
- Modals provide user-friendly interfaces for reject and price modification
- Table is responsive and includes hover effects
- Status filter allows admins to view specific tour states
- All API calls include error handling and user feedback

