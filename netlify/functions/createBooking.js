/**
 * Netlify Function: Create Booking
 * Handles booking creation, database storage, PDF generation, and email notifications
 */

const { neon } = require('@netlify/neon');
const { generateBookingPDF } = require('../../utils/generateBookingPDF');
const nodemailer = require('nodemailer');

// Initialize Neon connection
const sql = neon();

// Helper to clean base64 string
function cleanBase64(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/^data:application\/pdf;base64,/, '').trim();
}

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
            totalPrice,
            pdfData  // Optional: base64 PDF from client
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

        // 3. Convert all fields to correct PostgreSQL types
        // Clean date: ensure it becomes a proper ISO date string YYYY-MM-DD
        let cleanDate;
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Invalid date format'
                    })
                };
            }
            cleanDate = dateObj.toISOString().split('T')[0];
        } catch (error) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid date format'
                })
            };
        }

        // Clean people: convert to integer
        const cleanPeople = parseInt(people, 10);
        if (isNaN(cleanPeople)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid people count'
                })
            };
        }

        // Clean totalPrice: convert to integer
        const cleanTotal = parseInt(totalPrice, 10);
        if (isNaN(cleanTotal)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid total price'
                })
            };
        }

        // Clean addons: convert array to comma-separated string ("" if empty)
        const cleanAddons = Array.isArray(addons) 
            ? addons.join(',') 
            : (addons ? String(addons).trim() : '');

        // Clean string fields
        const cleanName = String(name || '').trim();
        const cleanEmail = String(email || '').trim();
        const cleanPhone = String(phone || '').trim();
        const cleanTour = String(tour || '').trim();

        // Generate booking ID
        const bookingId = `CBT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        console.log('Cleaned booking data:', {
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            tour: cleanTour,
            date: cleanDate,
            people: cleanPeople,
            addons: cleanAddons,
            total_price: cleanTotal
        });
        console.log('Inserting booking into database...');
        
        // Save booking to Neon database using cleaned values
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
                ${cleanName},
                ${cleanEmail},
                ${cleanPhone},
                ${cleanTour},
                ${cleanDate},
                ${cleanPeople},
                ${cleanAddons},
                ${cleanTotal}
            ) RETURNING id
        `;

        const bookingDbId = insertResult[0].id;
        console.log('Booking saved to database with ID:', bookingDbId);

        // 4. Handle PDF - use provided base64 or generate on server
        let pdfBase64;
        let pdfBufferLength = 0;
        
        // Validate pdfData if provided
        if (pdfData) {
            if (typeof pdfData !== 'string') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Invalid PDF data (not base64)'
                    })
                };
            }
            // Clean and use provided base64 PDF
            pdfBase64 = cleanBase64(pdfData);
            console.log('Using provided base64 PDF, length:', pdfBase64.length);
        } else {
            // Generate PDF on server
            console.log('Generating booking PDF on server...');
            const pdfGenerationData = {
                bookingId,
                customerName: cleanName,
                customerEmail: cleanEmail,
                phone: cleanPhone,
                tourName: cleanTour,
                tourDate: cleanDate,
                numberOfGuests: cleanPeople,
                addons: Array.isArray(addons) ? addons : (addons ? [addons] : []),
                totalPrice: cleanTotal,
                meetingLocation: 'Haeundae Beach' // Default meeting location
            };

            const result = await generateBookingPDF(pdfGenerationData);
            
            // Verify PDF buffer creation - ensure it's a proper Node Buffer
            let pdfBuffer;
            if (Buffer.isBuffer(result.buffer)) {
                pdfBuffer = result.buffer;
            } else if (result.buffer && typeof result.buffer === 'object') {
                // Convert to Buffer if it's not already
                pdfBuffer = Buffer.from(result.buffer);
            } else {
                pdfBuffer = Buffer.from(result.buffer);
            }
            
            // Log the raw PDF buffer BEFORE converting to base64
            console.log('PDF buffer length:', pdfBuffer.length);
            pdfBufferLength = pdfBuffer.length;
            
            if (pdfBuffer.length === 0) {
                console.error('PDF ERROR: PDF buffer is empty!');
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Failed to generate PDF - buffer is empty'
                    })
                };
            }
            
            console.log('PDF generated successfully on server');
            
            // Convert PDF buffer to base64 string and clean it
            pdfBase64 = cleanBase64(Buffer.from(pdfBuffer).toString('base64'));
            console.log('PDF converted to base64, length:', pdfBase64.length);
        }
        
        // Validate pdfBase64 before sending
        if (!pdfBase64 || pdfBase64.length < 50) {
            console.error('PDF ERROR: Base64 too short or invalid. Length:', pdfBase64 ? pdfBase64.length : 0);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid PDF data - base64 too short',
                    pdfLength: pdfBufferLength
                })
            };
        }

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
                    <p><strong>Number of Guests:</strong> ${cleanPeople}</p>
                    ${cleanAddons ? `<p><strong>Add-ons:</strong> ${cleanAddons}</p>` : ''}
                    <p><strong>Total Price:</strong> $${cleanTotal.toFixed(2)} USD</p>
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
Number of Guests: ${cleanPeople}
${cleanAddons ? `Add-ons: ${cleanAddons}\n` : ''}Total Price: $${cleanTotal.toFixed(2)} USD

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
                    content: pdfBase64,  // base64 string only
                    filename: 'booking-summary.pdf',
                    type: 'application/pdf',
                    disposition: 'attachment'
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
                    <p><strong>People:</strong> ${cleanPeople}</p>
                    ${cleanAddons ? `<p><strong>Add-ons:</strong> ${cleanAddons}</p>` : ''}
                    <p><strong>Total Price:</strong> $${cleanTotal.toFixed(2)} USD</p>
                </div>
                <p>Full booking details are in the attached PDF.</p>
            `,
            attachments: [
                {
                    content: pdfBase64,  // base64 string only
                    filename: 'booking-summary.pdf',
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ]
        });
        console.log('Admin email sent successfully');

        // 6. Return success response (temporarily includes pdfLength for testing)
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                bookingId: bookingId,
                message: 'Booking created and confirmation sent.',
                pdfLength: pdfBufferLength || pdfBase64.length
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

