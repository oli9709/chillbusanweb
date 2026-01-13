/**
 * Vercel API Route: Admin - Approve Refund
 * POST /api/admin/refunds/:id/approve
 * Creates Stripe refund and updates refund/booking status
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
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

        // Get refund ID from URL
        const refundId = req.query.id;

        if (!refundId) {
            return res.status(400).json({
                success: false,
                message: 'Refund ID is required'
            });
        }

        // Fetch refund with booking info
        const { data: refund, error: refundError } = await supabase
            .from('refunds')
            .select(`
                id,
                booking_id,
                amount_krw,
                status,
                bookings!inner(
                    id,
                    stripe_payment_intent,
                    final_amount_krw,
                    status
                )
            `)
            .eq('id', refundId)
            .maybeSingle();

        if (refundError) {
            console.error('Error fetching refund:', refundError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch refund',
                error: refundError.message
            });
        }

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund not found'
            });
        }

        if (refund.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Refund is already ${refund.status}`
            });
        }

        const booking = refund.bookings;
        if (!booking.stripe_payment_intent) {
            return res.status(400).json({
                success: false,
                message: 'Booking does not have a Stripe payment intent'
            });
        }

        // Initialize Stripe
        const stripe = new Stripe(env.STRIPE_SECRET_KEY);

        // Create Stripe refund
        // Convert KRW to cents (Stripe uses smallest currency unit)
        // For KRW, 1 KRW = 1 unit (no cents)
        const refundAmount = refund.amount_krw || booking.final_amount_krw || 0;

        let stripeRefund;
        try {
            stripeRefund = await stripe.refunds.create({
                payment_intent: booking.stripe_payment_intent,
                amount: refundAmount, // KRW uses integer amounts
                reason: 'requested_by_customer'
            });
        } catch (stripeError) {
            console.error('Stripe refund error:', stripeError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create Stripe refund',
                error: stripeError.message
            });
        }

        // Update refund status
        const { error: updateRefundError } = await supabase
            .from('refunds')
            .update({
                status: 'completed',
                stripe_refund_id: stripeRefund.id
            })
            .eq('id', refundId);

        if (updateRefundError) {
            console.error('Error updating refund:', updateRefundError);
            // Refund was created in Stripe, but DB update failed
            // Log this for manual reconciliation
        }

        // Update booking status to 'refunded'
        const { error: updateBookingError } = await supabase
            .from('bookings')
            .update({
                status: 'refunded'
            })
            .eq('id', booking.id);

        if (updateBookingError) {
            console.error('Error updating booking:', updateBookingError);
        }

        // Log admin action (optional - can create admin_logs table)
        console.log(`[ADMIN ACTION] Refund ${refundId} approved by ${userEmail} at ${new Date().toISOString()}`);

        return res.status(200).json({
            success: true,
            message: 'Refund approved and processed',
            refund: {
                id: refundId,
                stripeRefundId: stripeRefund.id,
                status: 'completed'
            }
        });

    } catch (error) {
        console.error('Error approving refund:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

