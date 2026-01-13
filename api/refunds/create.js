/**
 * Vercel API Route: Create Refund Request
 * POST /api/refunds/create
 * Creates a refund request for a paid booking
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../../utils/env.js';

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
        // Initialize Supabase
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

        // Get request body
        const { bookingId, reason, userId } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID is required'
            });
        }

        // Fetch booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id, user_id, status, final_amount_krw, stripe_payment_intent')
            .eq('id', bookingId)
            .maybeSingle();

        if (bookingError) {
            console.error('Error fetching booking:', bookingError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch booking',
                error: bookingError.message
            });
        }

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Verify user owns the booking (if userId provided)
        if (userId && booking.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only request refunds for your own bookings'
            });
        }

        // Check if booking is eligible for refund
        if (booking.status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: `Only paid bookings can be refunded. Current status: ${booking.status}`
            });
        }

        // Check if refund already exists
        const { data: existingRefund, error: refundCheckError } = await supabase
            .from('refunds')
            .select('id, status')
            .eq('booking_id', bookingId)
            .in('status', ['pending', 'completed'])
            .maybeSingle();

        if (refundCheckError && refundCheckError.code !== 'PGRST116') {
            console.error('Error checking existing refund:', refundCheckError);
        }

        if (existingRefund) {
            return res.status(400).json({
                success: false,
                message: `Refund request already exists with status: ${existingRefund.status}`
            });
        }

        // Create refund request
        const { data: refund, error: createError } = await supabase
            .from('refunds')
            .insert({
                booking_id: bookingId,
                amount_krw: booking.final_amount_krw || 0,
                status: 'pending',
                reason: reason || 'Customer requested refund'
            })
            .select('id, status')
            .maybeSingle();

        if (createError) {
            console.error('Error creating refund:', createError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create refund request',
                error: createError.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Refund request created successfully',
            refund: {
                id: refund.id,
                status: refund.status
            }
        });

    } catch (error) {
        console.error('Error creating refund request:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

