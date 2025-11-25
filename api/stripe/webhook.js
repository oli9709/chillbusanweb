/**
 * Vercel API Route: Stripe Webhook Handler
 * Handles Stripe webhook events for payment processing
 * Verifies signature and updates booking status
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { withSentry, logError, logMessage } from '../../utils/sentry.js';

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

// Helper to get raw body for Stripe signature verification
// In Vercel, we need to handle raw body differently
async function getRawBody(req) {
    // Try to get raw body from request stream
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

async function handler(req, res) {
    // Stripe webhooks only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        // Initialize Stripe
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!stripeSecretKey || !webhookSecret) {
            console.error('Missing Stripe configuration');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Stripe credentials missing'
            });
        }

        const stripe = new Stripe(stripeSecretKey);

        // Get raw body for signature verification
        // In Vercel, we need to read the raw body stream
        let rawBody;
        
        if (req.body && Buffer.isBuffer(req.body)) {
            rawBody = req.body;
        } else if (typeof req.body === 'string') {
            rawBody = Buffer.from(req.body);
        } else {
            // Try to get raw body from request stream
            try {
                rawBody = await getRawBody(req);
            } catch (err) {
                // Fallback: reconstruct from parsed body (less secure but works)
                console.warn('Could not get raw body, using parsed body (signature verification may fail)');
                rawBody = Buffer.from(JSON.stringify(req.body || {}));
            }
        }

        // Get Stripe signature from headers
        const signature = req.headers['stripe-signature'];

        if (!signature) {
            console.error('Missing Stripe signature');
            return res.status(400).json({
                success: false,
                message: 'Missing Stripe signature'
            });
        }

        // Verify webhook signature
        let event;
        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).json({
                success: false,
                message: `Webhook signature verification failed: ${err.message}`
            });
        }

        // Initialize Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase configuration');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Supabase credentials missing'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Log event to stripe_events table
        const eventData = {
            event_id: event.id,
            event_type: event.type,
            event_data: event.data.object,
            processed: false
        };

        // Extract booking_id and session_id from metadata or event data
        let bookingId = null;
        let sessionId = null;
        let paymentIntent = null;

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            sessionId = session.id;
            bookingId = session.metadata?.booking_id || null;
            paymentIntent = session.payment_intent || null;
        } else if (event.type === 'payment_intent.succeeded') {
            const paymentIntentObj = event.data.object;
            paymentIntent = paymentIntentObj.id;
            // Try to find booking by payment_intent in metadata
            bookingId = paymentIntentObj.metadata?.booking_id || null;
        }

        eventData.booking_id = bookingId;
        eventData.session_id = sessionId;
        eventData.payment_intent = paymentIntent;

        // Log webhook event to Sentry
        logMessage(`Stripe webhook event received: ${event.type}`, {
            level: 'info',
            tags: {
                event_type: event.type,
                event_id: event.id
            },
            extra: {
                booking_id: bookingId,
                session_id: sessionId,
                payment_intent: paymentIntent
            }
        });

        // Insert event log into stripe_events table
        const { data: eventLog, error: logError } = await supabase
            .from('stripe_events')
            .insert(eventData)
            .select('id')
            .maybeSingle();

        if (logError) {
            console.error('Error logging Stripe event to database:', logError);
            logError(logError, {
                tags: {
                    handler: 'stripeWebhook',
                    action: 'logEvent'
                },
                extra: {
                    event_id: event.id,
                    event_type: event.type
                }
            });
            // Continue processing even if logging fails
        } else {
            console.log(`Stripe event logged to database: ${event.id} (${event.type})`);
        }

        // Handle specific events
        if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
            // Find booking by booking_id or session_id
            let booking = null;

            if (bookingId) {
                const { data: bookingData, error: bookingError } = await supabase
                    .from('bookings')
                    .select('id, user_id, status, total_amount_krw, final_amount_krw')
                    .eq('id', bookingId)
                    .maybeSingle();

                if (bookingError) {
                    console.error('Error fetching booking by ID:', bookingError);
                } else {
                    booking = bookingData;
                }
            }

            // If not found by booking_id, try session_id
            if (!booking && sessionId) {
                const { data: bookingData, error: bookingError } = await supabase
                    .from('bookings')
                    .select('id, user_id, status, total_amount_krw, final_amount_krw')
                    .eq('stripe_session_id', sessionId)
                    .maybeSingle();

                if (bookingError) {
                    console.error('Error fetching booking by session ID:', bookingError);
                } else {
                    booking = bookingData;
                }
            }

            if (!booking) {
                console.warn(`Booking not found for event ${event.id} (booking_id: ${bookingId}, session_id: ${sessionId})`);
                // Mark event as processed even if booking not found
                if (eventLog?.id) {
                    await supabase
                        .from('stripe_events')
                        .update({ processed: true })
                        .eq('id', eventLog.id);
                }
                return res.status(200).json({
                    success: true,
                    message: 'Event received but booking not found',
                    eventId: event.id
                });
            }

            // Update booking status to 'paid'
            const updateData = {
                status: 'paid'
            };

            if (paymentIntent) {
                updateData.stripe_payment_intent = paymentIntent;
            }

            const { error: updateError } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', booking.id);

            if (updateError) {
                console.error('Error updating booking status:', updateError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update booking status',
                    error: updateError.message
                });
            }

            // Mark event as processed
            if (eventLog?.id) {
                await supabase
                    .from('stripe_events')
                    .update({ processed: true })
                    .eq('id', eventLog.id);
            }

            // Send confirmation emails
            try {
                // Get user email from users table
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('email, name')
                    .eq('id', booking.user_id)
                    .maybeSingle();

                if (userError) {
                    console.error('Error fetching user:', userError);
                }

                const userEmail = userData?.email || null;
                const userName = userData?.name || 'Valued Customer';

                // Get booking items for email
                const { data: itemsData, error: itemsError } = await supabase
                    .from('booking_items')
                    .select('name, quantity, unit_price_krw')
                    .eq('booking_id', booking.id);

                if (itemsError) {
                    console.error('Error fetching booking items:', itemsError);
                }

                const items = itemsData || [];

                // Prepare email content
                const emailSubject = `Payment Confirmed - Booking ${booking.id}`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2c3e50;">Payment Confirmed!</h2>
                        <p>Dear ${userName},</p>
                        <p>Your payment has been successfully processed.</p>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Booking Details</h3>
                            <p><strong>Booking ID:</strong> ${booking.id}</p>
                            <p><strong>Status:</strong> Paid</p>
                            <p><strong>Total Amount:</strong> ₩${booking.final_amount_krw?.toLocaleString() || booking.total_amount_krw?.toLocaleString()}</p>
                            ${items.length > 0 ? `
                                <h4>Items:</h4>
                                <ul>
                                    ${items.map(item => `
                                        <li>${item.name} x${item.quantity} - ₩${item.unit_price_krw?.toLocaleString()}</li>
                                    `).join('')}
                                </ul>
                            ` : ''}
                        </div>
                        <p>Your booking is now confirmed. We look forward to seeing you!</p>
                        <p>If you have any questions, please contact us at +82 010-3973-2052</p>
                        <p>Best regards,<br><strong>Chill Busan Tours</strong></p>
                    </div>
                `;

                const emailText = `
Payment Confirmed!

Dear ${userName},

Your payment has been successfully processed.

Booking ID: ${booking.id}
Status: Paid
Total Amount: ₩${booking.final_amount_krw?.toLocaleString() || booking.total_amount_krw?.toLocaleString()}

${items.length > 0 ? `Items:\n${items.map(item => `- ${item.name} x${item.quantity} - ₩${item.unit_price_krw?.toLocaleString()}`).join('\n')}\n` : ''}

Your booking is now confirmed. We look forward to seeing you!

If you have any questions, please contact us at +82 010-3973-2052

Best regards,
Chill Busan Tours
                `;

                const transporter = createTransporter();

                // Send email to customer if email available
                if (userEmail) {
                    await transporter.sendMail({
                        from: `"Chill Busan Tours" <${process.env.EMAIL_USER || 'chilltours.official@gmail.com'}>`,
                        to: userEmail,
                        subject: emailSubject,
                        text: emailText,
                        html: emailHtml
                    });
                    console.log(`Payment confirmation email sent to ${userEmail}`);
                }

                // Send notification email to admin
                await transporter.sendMail({
                    from: `"Chill Busan Tours" <${process.env.EMAIL_USER || 'chilltours.official@gmail.com'}>`,
                    to: 'chilltours.official@gmail.com',
                    subject: `Payment Received - Booking ${booking.id}`,
                    text: `Payment confirmed for booking ${booking.id}\n\n${emailText}`,
                    html: `
                        <h2>Payment Received</h2>
                        <p>Payment confirmed for booking ${booking.id}</p>
                        ${emailHtml}
                    `
                });
                console.log('Payment notification email sent to admin');

            } catch (emailError) {
                console.error('Error sending confirmation emails:', emailError);
                // Don't fail the webhook if email fails
            }

            return res.status(200).json({
                success: true,
                message: 'Event processed successfully',
                eventId: event.id,
                bookingId: booking.id
            });
        }

        // For other event types, just log them
        if (eventLog?.id) {
            await supabase
                .from('stripe_events')
                .update({ processed: true })
                .eq('id', eventLog.id);
        }

        return res.status(200).json({
            success: true,
            message: 'Event received and logged',
            eventId: event.id,
            eventType: event.type
        });

    } catch (error) {
        console.error('Webhook error:', error);
        logError(error, {
            tags: {
                handler: 'stripeWebhook',
                method: req.method
            },
            extra: {
                headers: req.headers,
                hasSignature: !!req.headers['stripe-signature']
            }
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

// Export handler wrapped with Sentry
export default withSentry(handler);

