/**
 * Vercel API Route: Booking Confirmation with PDF
 * Generates PDF and sends confirmation email with attachment
 */

import { generateTourPDF } from '../utils/generateTourPDF.js';
import { sendBookingConfirmationEmail } from '../utils/sendEmail.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const bookingDetails = req.body;

        // Validate required fields
        const requiredFields = [
            'customerName',
            'customerEmail',
            'tourName',
            'tourDate',
            'startTime',
            'bookingId'
        ];

        const missingFields = requiredFields.filter(field => !bookingDetails[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missingFields
            });
        }

        // Set defaults
        bookingDetails.locations = bookingDetails.locations || [];
        bookingDetails.optionalActivities = bookingDetails.optionalActivities || [];
        bookingDetails.totalPrice = bookingDetails.totalPrice || 0;
        bookingDetails.numberOfGuests = bookingDetails.numberOfGuests || 1;
        bookingDetails.meetingLocation = bookingDetails.meetingLocation || 'Haeundae Beach';

        // Generate PDF
        console.log('Generating PDF for booking:', bookingDetails.bookingId);
        const { buffer, fileName } = await generateTourPDF(bookingDetails);
        console.log('PDF generated successfully:', fileName);

        // Email content
        const emailSubject = `Chill Busan Tours - Booking Confirmation #${bookingDetails.bookingId}`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Booking Confirmation</h2>
                <p>Dear ${bookingDetails.customerName},</p>
                <p>Thank you for booking with Chill Busan Tours!</p>
                <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
                <p><strong>Tour:</strong> ${bookingDetails.tourName}</p>
                <p><strong>Date:</strong> ${bookingDetails.tourDate}</p>
                <p><strong>Start Time:</strong> ${bookingDetails.startTime}</p>
                <p><strong>Number of Guests:</strong> ${bookingDetails.numberOfGuests}</p>
                <p><strong>Total Price:</strong> $${bookingDetails.totalPrice.toFixed(2)} USD</p>
                <p><strong>Meeting Point:</strong> ${bookingDetails.meetingLocation}</p>
                <p>Please find your booking confirmation PDF attached to this email.</p>
                <p>If you have any questions, please contact us at +82 010-3973-2052</p>
                <p>We look forward to showing you around Busan!</p>
                <p>Best regards,<br>Chill Busan Tours</p>
            </div>
        `;

        const emailText = `
Booking Confirmation

Dear ${bookingDetails.customerName},

Thank you for booking with Chill Busan Tours!

Booking ID: ${bookingDetails.bookingId}
Tour: ${bookingDetails.tourName}
Date: ${bookingDetails.tourDate}
Start Time: ${bookingDetails.startTime}
Number of Guests: ${bookingDetails.numberOfGuests}
Total Price: $${bookingDetails.totalPrice.toFixed(2)} USD
Meeting Point: ${bookingDetails.meetingLocation}

Please find your booking confirmation PDF attached to this email.

If you have any questions, please contact us at +82 010-3973-2052

We look forward to showing you around Busan!

Best regards,
Chill Busan Tours
        `;

        // Send emails using unified helper
        console.log('Sending confirmation emails...');
        const emailResults = await sendBookingConfirmationEmail({
            customerEmail: bookingDetails.customerEmail,
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
            attachments: [
                {
                    filename: fileName,
                    content: buffer,
                    contentType: 'application/pdf'
                }
            ],
            adminSubject: `New Booking: ${bookingDetails.bookingId} - ${bookingDetails.customerName}`
        });

        if (emailResults.errors.length > 0) {
            console.warn('Some emails failed to send:', emailResults.errors);
        } else {
            console.log('All emails sent successfully');
        }

        return res.status(200).json({
            success: true,
            message: 'Booking confirmation sent successfully',
            bookingId: bookingDetails.bookingId,
            pdfFileName: fileName
        });

    } catch (error) {
        console.error('Error processing booking confirmation:', error);
        return res.status(500).json({
            error: 'Failed to process booking confirmation',
            message: error.message
        });
    }
}

