# Booking API Implementation Summary

## Overview
Complete booking API system for Chill Busan Tours using Netlify Functions with database storage, PDF generation, and email notifications.

## Files Created/Modified

### 1. `netlify/functions/createBooking.js` (NEW)
**Purpose:** Main booking API endpoint that handles the complete booking flow.

**Functionality:**
1. ✅ Parses POST request body with fields: `name`, `email`, `phone`, `tour`, `date`, `people`, `addons`, `totalPrice`
2. ✅ Validates all required fields and returns error messages for missing fields
3. ✅ Saves booking to Neon database (`bookings` table)
4. ✅ Generates booking PDF using pdfkit
5. ✅ Sends confirmation emails to both customer and admin (chilltours.official@gmail.com)
6. ✅ Returns success response with booking ID

**Key Features:**
- CORS headers configured for cross-origin requests
- Input validation (email format, positive numbers, etc.)
- Automatic booking ID generation (`CBT-{timestamp}-{random}`)
- Converts addons array to comma-separated string for database storage
- Error handling with try/catch and proper error responses
- Uses environment variables for email configuration

**Database Schema:**
```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    tour TEXT,
    date TEXT,
    people INT,
    addons TEXT,
    total_price INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Environment Variables Required:**
- `EMAIL_HOST` (default: smtp.gmail.com)
- `EMAIL_PORT` (default: 587)
- `EMAIL_USER` (default: chilltours.official@gmail.com)
- `EMAIL_PASS` or `EMAIL_APP_PASSWORD`
- `NETLIFY_DATABASE_URL` (automatically set by Netlify when using Neon)

### 2. `utils/generateBookingPDF.js` (NEW)
**Purpose:** Utility function to generate booking confirmation PDFs.

**Functionality:**
- Creates professional PDF document (A4 size)
- Includes all booking details:
  - Booking ID
  - Customer information (name, email, phone)
  - Tour details (name, date, number of guests)
  - Add-ons list
  - Total price in USD
  - Meeting point
  - Emergency contact
  - Cancellation policy
- Returns PDF as Buffer for email attachment
- Formats dates in readable format

**Returns:**
```javascript
{
    buffer: Buffer,      // PDF file buffer
    fileName: string    // e.g., "ChillBusanTour-CBT-1234567890-1234.pdf"
}
```

## API Endpoint

**URL:** `/.netlify/functions/createBooking`

**Method:** `POST`

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+82 010-1234-5678",
    "tour": "Hidden Gems Tour",
    "date": "2025-02-15",
    "people": 2,
    "addons": ["Lunch Option", "Evening Activity"],
    "totalPrice": 150.00
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Booking created and confirmation sent.",
    "bookingId": "CBT-1234567890-1234",
    "bookingDbId": 1
}
```

**Error Response (400):**
```json
{
    "success": false,
    "message": "Missing field: email, phone"
}
```

**Error Response (500):**
```json
{
    "success": false,
    "message": "Failed to create booking",
    "error": "Error message details"
}
```

## Dependencies

All dependencies are already in `package.json`:
- ✅ `@netlify/neon` - Database connection
- ✅ `nodemailer` - Email sending
- ✅ `pdfkit` - PDF generation

## Database Setup

**Required Table: `bookings`**

Create this table in your Neon database:

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    tour TEXT NOT NULL,
    date TEXT NOT NULL,
    people INT NOT NULL,
    addons TEXT,
    total_price INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Email Configuration

The function uses nodemailer with Gmail SMTP. Set these environment variables in Netlify:

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add:
   - `EMAIL_HOST` = `smtp.gmail.com`
   - `EMAIL_PORT` = `587`
   - `EMAIL_USER` = `chilltours.official@gmail.com`
   - `EMAIL_PASS` = `[Your Gmail App Password]`
   - `NETLIFY_DATABASE_URL` = `[Auto-set by Netlify when using Neon]`

**Note:** For Gmail, you need to use an App Password, not your regular password.

## Workflow

1. **Client sends POST request** with booking data
2. **Function validates** all required fields
3. **Booking saved** to Neon database
4. **PDF generated** with booking details
5. **Two emails sent:**
   - Customer receives confirmation email with PDF
   - Admin receives notification email with PDF
6. **Success response** returned to client

## Testing

To test locally (requires environment variables):

```bash
# Set environment variables
export NETLIFY_DATABASE_URL="your-database-url"
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"

# Test the function
curl -X POST http://localhost:8888/.netlify/functions/createBooking \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+82 010-1234-5678",
    "tour": "Test Tour",
    "date": "2025-02-15",
    "people": 2,
    "addons": ["Lunch"],
    "totalPrice": 100
  }'
```

## Error Handling

- ✅ Missing required fields → 400 Bad Request
- ✅ Invalid email format → 400 Bad Request
- ✅ Invalid number values → 400 Bad Request
- ✅ Database errors → 500 Internal Server Error
- ✅ PDF generation errors → 500 Internal Server Error
- ✅ Email sending errors → 500 Internal Server Error

All errors are logged to console and returned with descriptive messages.

## Security

- ✅ Input validation on all fields
- ✅ Email format validation
- ✅ Number validation (prevents NaN/invalid values)
- ✅ SQL injection prevention (using parameterized queries with @netlify/neon)
- ✅ CORS headers configured
- ✅ Environment variables for sensitive data

## Next Steps

1. **Deploy to Netlify** - Function will be available at `/.netlify/functions/createBooking`
2. **Set environment variables** in Netlify dashboard
3. **Create database table** in Neon (if not already created)
4. **Test the endpoint** with a real booking
5. **Integrate with frontend** - Update booking forms to call this endpoint

## Integration Example

```javascript
// Frontend JavaScript
async function createBooking(bookingData) {
    try {
        const response = await fetch('/.netlify/functions/createBooking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Booking created:', result.bookingId);
            return result;
        } else {
            console.error('Booking failed:', result.message);
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
```

