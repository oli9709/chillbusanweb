/**
 * Netlify Function: Create Booking
 * Handles booking creation, database storage, PDF generation, and email notifications
 */

const { neon } = require('@netlify/neon');
const { generateBookingPDF } = require('../../utils/generateBookingPDF');
const nodemailer = require('nodemailer');

// Initialize Neon connection
const sql = neon();

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || 'chilltours.official@gmail.com',
            pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD
        }
    });
};

module.exports.handler = async (event) => {
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
            body: JSON.stringify({
                success: false,
                message: 'Method not allowed'
            })
        };
    }

    try {
        // 1. Parse POST request body
        const bookingData = JSON.parse(event.body);
        const {
            name,
            email,
            phone,
            tour,
            date,
            people,
            addons,
            totalPrice
        } = bookingData;

        // 2. Validate all required fields
        const requiredFields = {
            name: 'name',
            email: 'email',
            phone: 'phone',
            tour: 'tour',
            date: 'date',
            people: 'people',
            totalPrice: 'totalPrice'
        };

        const missingFields = [];
        for (const [key, label] of Object.entries(requiredFields)) {
            if (!bookingData[key] && bookingData[key] !== 0) {
                missingFields.push(label);
            }
        }

        if (missingFields.length > 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: `Missing field: ${missingFields.join(', ')}`
                })
            };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid email format'
                })
            };
        }

        // Validate people is a positive number
        const peopleNum = parseInt(people, 10);
        if (isNaN(peopleNum) || peopleNum < 1) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'People must be a positive number'
                })
            };
        }

        // Validate totalPrice is a number
        const totalPriceNum = parseFloat(totalPrice);
        if (isNaN(totalPriceNum) || totalPriceNum < 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Total price must be a valid number'
                })
            };
        }

        // 3. Save booking to Neon database
        // Convert addons array to comma-separated string
        const addonsString = Array.isArray(addons) 
            ? addons.join(', ') 
            : (addons || '');

        // Generate booking ID
        const bookingId = `CBT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        console.log('Inserting booking into database...');
        const insertResult = await sql`
            INSERT INTO bookings (
                name,
                email,
                phone,
                tour,
                date,
                people,
                addons,
                total_price
            ) VALUES (
                ${name},
                ${email},
                ${phone},
                ${tour},
                ${date},
                ${peopleNum},
                ${addonsString},
                ${Math.round(totalPriceNum)}
            ) RETURNING id
        `;

        const bookingDbId = insertResult[0].id;
        console.log('Booking saved to database with ID:', bookingDbId);

        // 4. Generate PDF
        console.log('Generating booking PDF...');
        const pdfData = {
            bookingId,
            customerName: name,
            customerEmail: email,
            phone,
            tourName: tour,
            tourDate: date,
            numberOfGuests: peopleNum,
            addons: Array.isArray(addons) ? addons : (addons ? [addons] : []),
            totalPrice: totalPriceNum,
            meetingLocation: 'Haeundae Beach' // Default meeting location
        };

        const { buffer: pdfBuffer, fileName } = await generateBookingPDF(pdfData);
        console.log('PDF generated successfully:', fileName);

        // 5. Send emails using nodemailer
        const transporter = createTransporter();

        // Email content
        const emailSubject = `Chill Busan Tours - Booking Confirmation #${bookingId}`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Booking Confirmation</h2>
                <p>Dear ${name},</p>
                <p>Thank you for booking with Chill Busan Tours!</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Booking ID:</strong> ${bookingId}</p>
                    <p><strong>Tour:</strong> ${tour}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Number of Guests:</strong> ${peopleNum}</p>
                    ${addonsString ? `<p><strong>Add-ons:</strong> ${addonsString}</p>` : ''}
                    <p><strong>Total Price:</strong> $${totalPriceNum.toFixed(2)} USD</p>
                </div>
                <p>Please find your booking confirmation PDF attached to this email.</p>
                <p>If you have any questions, please contact us at +82 010-3973-2052</p>
                <p>We look forward to showing you around Busan!</p>
                <p>Best regards,<br><strong>Chill Busan Tours</strong></p>
            </div>
        `;

        const emailText = `
Booking Confirmation

Dear ${name},

Thank you for booking with Chill Busan Tours!

Booking ID: ${bookingId}
Tour: ${tour}
Date: ${date}
Number of Guests: ${peopleNum}
${addonsString ? `Add-ons: ${addonsString}\n` : ''}Total Price: $${totalPriceNum.toFixed(2)} USD

Please find your booking confirmation PDF attached to this email.

If you have any questions, please contact us at +82 010-3973-2052

We look forward to showing you around Busan!

Best regards,
Chill Busan Tours
        `;

        // A) Send email to customer
        console.log('Sending confirmation email to customer...');
        await transporter.sendMail({
            from: `"Chill Busan Tours" <${process.env.EMAIL_USER || 'chilltours.official@gmail.com'}>`,
            to: email,
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
            attachments: [
                {
                    filename: fileName,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });
        console.log('Customer email sent successfully');

        // B) Send email to admin
        console.log('Sending notification email to admin...');
        await transporter.sendMail({
            from: `"Chill Busan Tours" <${process.env.EMAIL_USER || 'chilltours.official@gmail.com'}>`,
            to: 'chilltours.official@gmail.com',
            subject: `New Booking: ${bookingId} - ${name}`,
            text: `New booking received:\n\n${JSON.stringify(bookingData, null, 2)}`,
            html: `
                <h2>New Booking Received</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <p><strong>Booking ID:</strong> ${bookingId}</p>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Tour:</strong> ${tour}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>People:</strong> ${peopleNum}</p>
                    ${addonsString ? `<p><strong>Add-ons:</strong> ${addonsString}</p>` : ''}
                    <p><strong>Total Price:</strong> $${totalPriceNum.toFixed(2)} USD</p>
                </div>
                <p>Full booking details are in the attached PDF.</p>
            `,
            attachments: [
                {
                    filename: fileName,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });
        console.log('Admin email sent successfully');

        // 6. Return success response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Booking created and confirmation sent.',
                bookingId,
                bookingDbId
            })
        };

    } catch (error) {
        console.error('Error creating booking:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to create booking',
                error: error.message
            })
        };
    }
};

