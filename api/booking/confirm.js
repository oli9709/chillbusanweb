/**
 * Vercel API Route: Confirm Booking (Payment)
 * POST /api/booking/confirm
 * Updates booking payment status from PENDING to PAID
 */

import { createClient } from '@supabase/supabase-js';
import { withSentry, logError } from '../../utils/sentry.js';
import { env } from '../../utils/env.js';

async function handler(req, res) {
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
        // Initialize Supabase
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

        // Parse and validate request body
        const {
            bookingId,
            paymentStatus
        } = req.body;

        // Validate required fields
        if (!bookingId || typeof bookingId !== 'string' || bookingId.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'bookingId is required and must be a non-empty string'
            });
        }

        // Validate paymentStatus
        const validStatuses = ['paid', 'failed'];
        if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: `paymentStatus must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Fetch existing booking
        const { data: existingBooking, error: fetchError } = await supabase
            .from('bookings_new')
            .select('id, bookingId, customerName, customerEmail, tourType, tourDate, price, paymentStatus')
            .eq('bookingId', bookingId.trim())
            .single();

        if (fetchError) {
            console.error('Error fetching booking:', fetchError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch booking',
                error: fetchError.message
            });
        }

        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if booking is already confirmed
        if (existingBooking.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already confirmed (paid)',
                booking: existingBooking
            });
        }

        // Update booking payment status
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings_new')
            .update({
                paymentStatus: paymentStatus,
                updatedAt: new Date().toISOString()
            })
            .eq('bookingId', bookingId.trim())
            .select('id, bookingId, customerName, customerEmail, tourType, tourDate, price, paymentStatus, createdAt, updatedAt')
            .single();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            logError(updateError, {
                tags: {
                    handler: 'bookingConfirm',
                    action: 'updateBooking'
                },
                extra: {
                    bookingId: bookingId,
                    paymentStatus: paymentStatus
                }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to confirm booking',
                error: updateError.message
            });
        }

        if (!updatedBooking) {
            return res.status(500).json({
                success: false,
                message: 'Failed to confirm booking: no data returned'
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: `Booking ${paymentStatus === 'paid' ? 'confirmed' : 'marked as failed'}`,
            booking: {
                id: updatedBooking.id,
                bookingId: updatedBooking.bookingId,
                customerName: updatedBooking.customerName,
                customerEmail: updatedBooking.customerEmail,
                tourType: updatedBooking.tourType,
                tourDate: updatedBooking.tourDate,
                price: updatedBooking.price,
                paymentStatus: updatedBooking.paymentStatus,
                createdAt: updatedBooking.createdAt,
                updatedAt: updatedBooking.updatedAt
            }
        });

    } catch (error) {
        console.error('Error confirming booking:', error);
        logError(error, {
            tags: {
                handler: 'bookingConfirm',
                method: req.method
            },
            extra: {
                body: req.body
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

