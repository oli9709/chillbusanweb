/**
 * Vercel API Route: Update Booking Payment Option
 * POST /api/bookings/:id/update-payment-option
 * Changes payment_option to 'pay_after' for a pending booking
 */

import { createClient } from '@supabase/supabase-js';

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
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Supabase credentials missing'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get booking ID from URL parameter
        const bookingId = req.query.id;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID is required'
            });
        }

        // Fetch booking to verify it exists and is pending
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('id, status, payment_option')
            .eq('id', bookingId)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching booking:', fetchError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch booking',
                error: fetchError.message
            });
        }

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot change payment option for ${booking.status} booking`
            });
        }

        // Update payment_option to 'pay_after' and remove discount
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                payment_option: 'pay_after',
                discount_percent: 0,
                final_amount_krw: null // Will be recalculated as total_amount_krw
            })
            .eq('id', bookingId)
            .select('id, payment_option')
            .maybeSingle();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to update booking',
                error: updateError.message
            });
        }

        // Recalculate final_amount_krw (no discount for pay_after)
        const { data: bookingWithTotal, error: totalError } = await supabase
            .from('bookings')
            .select('total_amount_krw')
            .eq('id', bookingId)
            .maybeSingle();

        if (!totalError && bookingWithTotal) {
            await supabase
                .from('bookings')
                .update({ final_amount_krw: bookingWithTotal.total_amount_krw })
                .eq('id', bookingId);
        }

        return res.status(200).json({
            success: true,
            message: 'Payment option updated to pay_after',
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Error updating payment option:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update payment option',
            error: error.message
        });
    }
}

