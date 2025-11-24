/**
 * Vercel API Route: Create Booking
 * Handles booking creation, database storage, PDF generation, and email notifications
 * Uses Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { generateBookingPDF } from '../utils/generateBookingPDF.js';
import nodemailer from 'nodemailer';

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
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        // Initialize Supabase client with service role key
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Supabase credentials missing'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get authenticated user from request body
        // Frontend sends userId in bookingData if user is authenticated
        const userId = req.body?.userId || null;

        // Parse POST request body
        const bookingData = req.body;
        const {
            name,
            email,
            phone,
            tour,
            date,
            people,
            addons,
            totalPrice,
            pdfData,  // Optional: base64 PDF from client
            applyDiscount = false  // Whether to apply welcome discount
        } = bookingData;

        // Validate all required fields
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
            return res.status(400).json({
                success: false,
                message: `Missing field: ${missingFields.join(', ')}`
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate people is a positive number
        const peopleNum = parseInt(people, 10);
        if (isNaN(peopleNum) || peopleNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'People must be a positive number'
            });
        }

        // Convert all fields to correct types
        // Clean date: ensure it becomes a proper ISO date string YYYY-MM-DD
        let cleanDate;
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format'
                });
            }
            cleanDate = dateObj.toISOString().split('T')[0];
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Clean people: convert to integer
        const cleanPeople = parseInt(people, 10);
        if (isNaN(cleanPeople)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid people count'
            });
        }

        // Clean totalPrice: convert to integer
        let cleanTotal = parseInt(totalPrice, 10);
        if (isNaN(cleanTotal)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid total price'
            });
        }

        // Apply welcome discount if requested and user is authenticated
        let discountApplied = false;
        let originalTotal = cleanTotal;
        let discountAmount = 0;
        
        if (applyDiscount && userId) {
            try {
                // Frontend already calculated discount, so totalPrice is the discounted amount
                // Reverse-calculate the original price: original = discounted / 0.9
                originalTotal = Math.round(cleanTotal / 0.9);
                discountAmount = originalTotal - cleanTotal;
                discountApplied = true;
                console.log(`Welcome discount applied: Original $${originalTotal}, Discount $${discountAmount}, Final $${cleanTotal}`);
            } catch (error) {
                console.error('Error processing discount:', error);
                discountApplied = false;
                originalTotal = cleanTotal;
                discountAmount = 0;
            }
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
            user_id: userId,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            tour: cleanTour,
            date: cleanDate,
            people: cleanPeople,
            addons: cleanAddons,
            total_price: cleanTotal
        });
        console.log('Inserting booking into Supabase...');
        
        // Save booking to Supabase using cleaned values
        const { data: bookingRecord, error: insertError } = await supabase
            .from('bookings')
            .insert({
                user_id: userId || null, // Link to authenticated user if available
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
                tour: cleanTour,
                date: cleanDate,
                people: cleanPeople,
                addons: cleanAddons,
                total_price: cleanTotal
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting booking:', insertError);
            return res.status(500).json({
                success: false,
                message: 'Failed to save booking to database',
                error: insertError.message
            });
        }

        const bookingDbId = bookingRecord.id;
        console.log('Booking saved to Supabase with ID:', bookingDbId);

        // Consume discount if it was applied
        if (discountApplied && userId) {
            try {
                const { error: discountError } = await supabase
                    .from('users')
                    .update({ first_booking_discount: false })
                    .eq('id', userId);
                
                if (discountError) {
                    console.warn('Failed to consume discount:', discountError);
                } else {
                    console.log(`Discount consumed for user: ${userId}`);
                }
            } catch (error) {
                console.error('Error consuming discount:', error);
                // Don't fail the booking if discount consumption fails
            }
        }

        // Handle PDF - use provided base64 or generate on server
        let pdfBase64;
        let pdfBufferLength = 0;
        
        // Validate pdfData if provided
        if (pdfData) {
            if (typeof pdfData !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid PDF data (not base64)'
                });
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
                originalPrice: discountApplied ? originalTotal : cleanTotal,
                discountApplied: discountApplied,
                discountAmount: discountApplied ? (originalTotal - cleanTotal) : 0,
                meetingLocation: 'Haeundae Beach' // Default meeting location
            };

            const result = await generateBookingPDF(pdfGenerationData);
            
            // Verify PDF buffer creation
            let pdfBuffer;
            if (Buffer.isBuffer(result.buffer)) {
                pdfBuffer = result.buffer;
            } else if (result.buffer && typeof result.buffer === 'object') {
                pdfBuffer = Buffer.from(result.buffer);
            } else {
                pdfBuffer = Buffer.from(result.buffer);
            }
            
            console.log('PDF buffer length:', pdfBuffer.length);
            pdfBufferLength = pdfBuffer.length;
            
            if (pdfBuffer.length === 0) {
                console.error('PDF ERROR: PDF buffer is empty!');
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate PDF - buffer is empty'
                });
            }
            
            console.log('PDF generated successfully on server');
            
            // Convert PDF buffer to base64 string and clean it
            pdfBase64 = cleanBase64(Buffer.from(pdfBuffer).toString('base64'));
            console.log('PDF converted to base64, length:', pdfBase64.length);
        }
        
        // Validate pdfBase64 before sending
        if (!pdfBase64 || pdfBase64.length < 50) {
            console.error('PDF ERROR: Base64 too short or invalid. Length:', pdfBase64 ? pdfBase64.length : 0);
            return res.status(500).json({
                success: false,
                message: 'Invalid PDF data - base64 too short',
                pdfLength: pdfBufferLength
            });
        }

        // Send emails using nodemailer
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
                    ${discountApplied ? `<p style="color: #27ae60;"><strong>Welcome Discount Applied:</strong> -10% ($${(originalTotal - cleanTotal).toFixed(2)})</p>` : ''}
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
${cleanAddons ? `Add-ons: ${cleanAddons}\n` : ''}${discountApplied ? `Welcome Discount Applied: -10% ($${(originalTotal - cleanTotal).toFixed(2)})\n` : ''}Total Price: $${cleanTotal.toFixed(2)} USD

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
                    content: pdfBase64,
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
                    content: pdfBase64,
                    filename: 'booking-summary.pdf',
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ]
        });
        console.log('Admin email sent successfully');

        // Return success response
        return res.status(200).json({
            success: true,
            bookingId: bookingId,
            message: 'Booking created and confirmation sent.',
            pdfLength: pdfBufferLength || pdfBase64.length
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
}

