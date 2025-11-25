/**
 * Vercel API Route: Create Stripe Checkout Session for Existing Booking
 * POST /api/bookings/:id/create-session
 * Creates a Stripe Checkout Session for a pending booking
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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

        // Fetch booking with items
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id, user_id, total_amount_krw, discount_percent, final_amount_krw, status, payment_option')
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

        // Check if booking is eligible for payment
        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Booking is already ${booking.status}. Cannot create payment session.`
            });
        }

        // Fetch booking items
        const { data: items, error: itemsError } = await supabase
            .from('booking_items')
            .select('name, unit_price_krw, quantity')
            .eq('booking_id', bookingId);

        if (itemsError) {
            console.error('Error fetching booking items:', itemsError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch booking items',
                error: itemsError.message
            });
        }

        // Initialize Stripe
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

        if (!stripeSecretKey) {
            return res.status(500).json({
                success: false,
                message: 'Stripe not configured'
            });
        }

        const stripe = new Stripe(stripeSecretKey);

        // Calculate line items with discount applied (10% for pay_now)
        const lineItems = (items || []).map(item => {
            const unitPrice = item.unit_price_krw;
            // Apply 10% discount for pay_now
            const discountedPrice = Math.round(unitPrice * 0.9);
            
            return {
                price_data: {
                    currency: 'krw',
                    product_data: {
                        name: item.name || 'Tour Item',
                    },
                    unit_amount: discountedPrice,
                },
                quantity: item.quantity || 1,
            };
        });

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${baseUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard`,
            metadata: {
                booking_id: bookingId,
                user_id: booking.user_id,
            },
        });

        // Update booking with Stripe session ID
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ stripe_session_id: session.id })
            .eq('id', bookingId);

        if (updateError) {
            console.warn('Error updating booking with Stripe session ID:', updateError);
        }

        return res.status(200).json({
            success: true,
            checkoutUrl: session.url,
            sessionId: session.id
        });

    } catch (error) {
        console.error('Error creating Stripe session:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create payment session',
            error: error.message
        });
    }
}

