# PDF Generation System Setup Instructions

## Overview
This system automatically generates PDF booking confirmations and sends them via email when customers complete a booking.

## Files Created

1. **`/utils/generateTourPDF.js`** - PDF generator utility
2. **`/netlify/functions/bookingConfirmation.js`** - Netlify function for booking confirmation
3. **`/utils/bookingAPI.js`** - Frontend API helper
4. **`/utils/testPDF.js`** - Test script for PDF generation
5. **`/temp_pdfs/`** - Directory for temporary PDF storage

## Installation

### 1. Install Dependencies

Navigate to the Netlify functions directory and install dependencies:

```bash
cd netlify/functions
npm install
```

This will install:
- `pdfkit` - PDF generation library
- `nodemailer` - Email sending library

### 2. Configure Email Settings

Set up environment variables in Netlify:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=chilltours.official@gmail.com
EMAIL_PASS=your-app-password-here
```

**Important for Gmail:**
- You need to use an **App Password**, not your regular password
- Enable 2-factor authentication on your Gmail account
- Generate an App Password: https://myaccount.google.com/apppasswords

### 3. Test PDF Generation

Run the test script to verify PDF generation works:

```bash
node utils/testPDF.js
```

This will:
- Generate a sample PDF
- Save it to `/temp_pdfs/`
- Display the file path and size

## Usage

### From Frontend (JavaScript)

```javascript
// Include the booking API helper
<script src="utils/bookingAPI.js"></script>

// When booking is completed
const bookingDetails = {
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    tourName: 'Busan Hidden Gems, Beaches & Local Food',
    tourDate: '2025-12-15',
    startTime: '09:00',
    locations: [
        'Gamcheon Culture Village',
        'Songdo Skywalk & Beach',
        'Haedong Yonggungsa Temple'
    ],
    optionalActivities: ['Hanbok rental'],
    totalPrice: 222.00,
    numberOfGuests: 2,
    meetingLocation: 'Haeundae Beach',
    bookingId: generateBookingId() // Auto-generate or use your own
};

// Send confirmation
try {
    const result = await sendBookingConfirmation(bookingDetails);
    console.log('Booking confirmed!', result);
    alert('Booking confirmation sent! Check your email.');
} catch (error) {
    console.error('Error:', error);
    alert('Failed to send confirmation. Please contact us directly.');
}
```

### From Custom Tour Builder

Update the `contactAboutCustomTour` function in `main.js`:

```javascript
async function contactAboutCustomTour() {
    // ... existing code to collect tour details ...
    
    const bookingDetails = {
        customerName: 'Customer Name', // Get from form
        customerEmail: 'customer@email.com', // Get from form
        tourName: 'Custom Tour',
        tourDate: selectedDate, // Get from form
        startTime: selectedTime, // Get from form
        locations: selectedLocations.map(loc => getLocationName(loc)),
        optionalActivities: selectedServices.map(s => getServiceName(s)),
        totalPrice: totalCost,
        numberOfGuests: numberOfGuests, // Get from form
        meetingLocation: 'Haeundae Beach',
        bookingId: generateBookingId()
    };
    
    try {
        const result = await sendBookingConfirmation(bookingDetails);
        showSuccessMessage('Booking confirmed! Check your email for confirmation.');
    } catch (error) {
        alert('Failed to send confirmation. Please contact us at chilltours.official@gmail.com');
    }
}
```

## PDF Content

The generated PDF includes:

- **Title**: "Chill Busan Tours — Booking Confirmation"
- **Booking ID**: Unique identifier
- **Customer Information**: Name and email
- **Tour Details**: Tour name, date, start time, number of guests
- **Itinerary**: List of locations
- **Optional Add-ons**: Selected activities
- **Total Price**: In USD
- **Meeting Point**: Default or custom location
- **Emergency Contact**: +82 010-3973-2052
- **Cancellation Policy**: Terms and conditions
- **Footer**: Thank you message

## Email Recipients

The system sends emails to:
1. **Customer** - Confirmation with PDF attachment
2. **Company** (chilltours.official@gmail.com) - Notification with booking details and PDF

## Troubleshooting

### PDF Generation Fails
- Check that `/temp_pdfs/` directory exists and is writable
- Verify `pdfkit` is installed: `npm list pdfkit`

### Email Sending Fails
- Verify environment variables are set in Netlify
- Check that Gmail App Password is correct
- Ensure 2FA is enabled on Gmail account
- Check Netlify function logs for detailed error messages

### CORS Errors
- The function already includes CORS headers
- If issues persist, check Netlify function configuration

## File Structure

```
/
├── utils/
│   ├── generateTourPDF.js    # PDF generator
│   ├── bookingAPI.js          # Frontend API helper
│   └── testPDF.js             # Test script
├── netlify/
│   └── functions/
│       └── bookingConfirmation.js  # Netlify function
├── temp_pdfs/                 # PDF storage (gitignored)
└── PDF_SETUP_INSTRUCTIONS.md  # This file
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure email environment variables
3. ✅ Test PDF generation
4. ✅ Integrate into booking flow
5. ✅ Test end-to-end booking confirmation

## Support

For issues or questions, contact: chilltours.official@gmail.com

