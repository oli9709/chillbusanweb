/**
 * Netlify Function: Booking Confirmation with PDF
 * Generates PDF and sends confirmation email with attachment
 */

const { generateTourPDF } = require('../../utils/generateTourPDF');
const nodemailer = require('nodemailer');

// Email configuration
// Note: In production, use environment variables for credentials
const createTransporter = () => {
    // Using Gmail SMTP (configure with environment variables in production)
    // For now, using a simple SMTP configuration
    // You'll need to set these in Netlify environment variables:
    // EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || 'chilltours.official@gmail.com',
            pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD // Use App Password for Gmail
        }
    });
};

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const bookingDetails = JSON.parse(event.body);

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
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing required fields',
                    missingFields
                })
            };
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

        // Create email transporter
        const transporter = createTransporter();

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

        // Send email to customer
        const customerMailOptions = {
            from: `"Chill Busan Tours" <${process.env.EMAIL_USER || 'chilltours.official@gmail.com'}>`,
            to: bookingDetails.customerEmail,
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
            attachments: [
                {
                    filename: fileName,
                    content: buffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        // Send email to company
        const companyMailOptions = {
            from: `"Chill Busan Tours" <${process.env.EMAIL_USER || 'chilltours.official@gmail.com'}>`,
            to: 'chilltours.official@gmail.com',
            subject: `New Booking: ${bookingDetails.bookingId} - ${bookingDetails.customerName}`,
            text: `New booking received:\n\n${JSON.stringify(bookingDetails, null, 2)}`,
            html: `
                <h2>New Booking Received</h2>
                <pre>${JSON.stringify(bookingDetails, null, 2)}</pre>
            `,
            attachments: [
                {
                    filename: fileName,
                    content: buffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        // Send both emails
        console.log('Sending confirmation email to customer...');
        await transporter.sendMail(customerMailOptions);
        console.log('Customer email sent successfully');

        console.log('Sending notification email to company...');
        await transporter.sendMail(companyMailOptions);
        console.log('Company email sent successfully');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Booking confirmation sent successfully',
                bookingId: bookingDetails.bookingId,
                pdfFileName: fileName
            })
        };

    } catch (error) {
        console.error('Error processing booking confirmation:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to process booking confirmation',
                message: error.message
            })
        };
    }
};

