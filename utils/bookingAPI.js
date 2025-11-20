/**
 * Frontend API helper for booking confirmation
 * Call this function when a booking is completed
 */

/**
 * Create a new booking using the createBooking API
 * @param {Object} bookingData - Booking information
 * @param {string} bookingData.name - Customer's full name
 * @param {string} bookingData.email - Customer's email
 * @param {string} bookingData.phone - Customer's phone number
 * @param {string} bookingData.tour - Tour name
 * @param {string} bookingData.date - Tour date (YYYY-MM-DD)
 * @param {number} bookingData.people - Number of people
 * @param {Array<string>} bookingData.addons - List of add-ons
 * @param {number} bookingData.totalPrice - Total price in USD
 * @returns {Promise<Object>} API response
 */
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

        if (!response.ok || !result.success) {
            throw new Error(result.message || result.error || 'Failed to create booking');
        }

        return result;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

/**
 * Send booking confirmation with PDF generation (legacy function for backward compatibility)
 * @param {Object} bookingDetails - Booking information
 * @param {string} bookingDetails.customerName - Customer's full name
 * @param {string} bookingDetails.customerEmail - Customer's email
 * @param {string} bookingDetails.tourName - Name of the tour
 * @param {string} bookingDetails.tourDate - Tour date (YYYY-MM-DD)
 * @param {string} bookingDetails.startTime - Start time (HH:MM)
 * @param {Array<string>} bookingDetails.locations - List of locations/itinerary
 * @param {Array<string>} bookingDetails.optionalActivities - Optional add-ons
 * @param {number} bookingDetails.totalPrice - Total price in USD
 * @param {number} bookingDetails.numberOfGuests - Number of guests
 * @param {string} bookingDetails.meetingLocation - Meeting point
 * @param {string} bookingDetails.bookingId - Unique booking ID
 * @returns {Promise<Object>} API response
 */
async function sendBookingConfirmation(bookingDetails) {
    try {
        // Map field names to match backend expectations
        const payload = {
            customerName: bookingDetails.customerName,
            customerEmail: bookingDetails.customerEmail,
            tourName: bookingDetails.tourName,
            tourDate: bookingDetails.tourDate || bookingDetails.date,
            startTime: bookingDetails.startTime,
            locations: bookingDetails.locations || bookingDetails.selectedLocations || bookingDetails.itinerary || [],
            optionalActivities: bookingDetails.optionalActivities || bookingDetails.optionalAddOns || bookingDetails.optional || [],
            totalPrice: bookingDetails.totalPrice,
            numberOfGuests: bookingDetails.numberOfGuests || bookingDetails.guestCount || 1,
            meetingLocation: bookingDetails.meetingLocation || bookingDetails.meetingPoint || 'Haeundae Beach',
            bookingId: bookingDetails.bookingId || generateBookingId()
        };

        const response = await fetch('/.netlify/functions/bookingConfirmation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to send booking confirmation');
        }

        return result;
    } catch (error) {
        console.error('Error sending booking confirmation:', error);
        throw error;
    }
}

/**
 * Generate a unique booking ID
 * @returns {string} Booking ID
 */
function generateBookingId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `CBT-${timestamp}-${random}`;
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.createBooking = createBooking;
    window.sendBookingConfirmation = sendBookingConfirmation;
    window.generateBookingId = generateBookingId;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createBooking, sendBookingConfirmation, generateBookingId };
}

