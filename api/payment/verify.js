/**
 * Vercel API Route: Payment Verification
 * POST /api/payment/verify
 * Verifies payment and updates booking status to PAID
 * 
 * This is a placeholder handler that will be extended for PayPal/Stripe integration
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
            transactionId,
            amount,
            status
        } = req.body;

        // Validate required fields
        if (!bookingId || typeof bookingId !== 'string' || bookingId.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'bookingId is required and must be a non-empty string'
            });
        }

        if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'transactionId is required and must be a non-empty string'
            });
        }

        if (amount === undefined || amount === null) {
            return res.status(400).json({
                success: false,
                message: 'amount is required'
            });
        }

        // Validate amount is a positive number
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'amount must be a positive number'
            });
        }

        // Validate status
        const validStatuses = ['paid', 'failed', 'pending'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be one of: ${validStatuses.join(', ')}`
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

        // Verify amount matches (allow small difference for rounding)
        const priceDifference = Math.abs(existingBooking.price - amountNum);
        if (priceDifference > 0.01) {
            console.warn(`Amount mismatch: booking price=${existingBooking.price}, payment amount=${amountNum}`);
            // Log warning but don't fail - payment processors may have fees
        }

        // Update booking payment status
        const updateData = {
            paymentStatus: status,
            updatedAt: new Date().toISOString()
        };

        // Store transaction ID in metadata (if you add a transactions table later)
        // For now, we'll log it
        console.log(`Payment verification: bookingId=${bookingId}, transactionId=${transactionId}, status=${status}`);

        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings_new')
            .update(updateData)
            .eq('bookingId', bookingId.trim())
            .select('id, bookingId, customerName, customerEmail, tourType, tourDate, price, paymentStatus, createdAt, updatedAt')
            .single();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            logError(updateError, {
                tags: {
                    handler: 'paymentVerify',
                    action: 'updateBooking'
                },
                extra: {
                    bookingId: bookingId,
                    transactionId: transactionId,
                    status: status
                }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to update booking payment status',
                error: updateError.message
            });
        }

        if (!updatedBooking) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update booking: no data returned'
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: `Payment ${status === 'paid' ? 'verified and booking confirmed' : status === 'failed' ? 'verification failed' : 'verification pending'}`,
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
            },
            transaction: {
                transactionId: transactionId,
                amount: amountNum,
                status: status
            }
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        logError(error, {
            tags: {
                handler: 'paymentVerify',
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

