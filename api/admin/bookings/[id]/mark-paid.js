/**
 * Vercel API Route: Admin - Mark Booking as Paid
 * POST /api/admin/bookings/:id/mark-paid
 * Manually marks a pay_after booking as paid
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../../../utils/env.js';

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
        // Check admin authorization
        const adminEmail = env.SUPPORT_EMAIL;
        const userEmail = req.headers['x-user-email'] || req.body?.email;

        if (!adminEmail || userEmail !== adminEmail) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Admin access required'
            });
        }

        // Initialize Supabase
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

        // Get booking ID from URL
        const bookingId = req.query.id;
        const { paymentNote } = req.body || {};

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID is required'
            });
        }

        // Fetch booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id, status, payment_option')
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

        if (booking.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already marked as paid'
            });
        }

        // Update booking status to paid
        const updateData = {
            status: 'paid'
        };

        // Store payment note if provided (you may need to add a payment_note column)
        // For now, we'll just log it
        if (paymentNote) {
            console.log(`[PAYMENT NOTE] Booking ${bookingId}: ${paymentNote}`);
        }

        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId)
            .select('id, status')
            .maybeSingle();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to update booking',
                error: updateError.message
            });
        }

        // Log admin action
        console.log(`[ADMIN ACTION] Booking ${bookingId} marked as paid by ${userEmail} at ${new Date().toISOString()}${paymentNote ? ` - Note: ${paymentNote}` : ''}`);

        return res.status(200).json({
            success: true,
            message: 'Booking marked as paid',
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Error marking booking as paid:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

