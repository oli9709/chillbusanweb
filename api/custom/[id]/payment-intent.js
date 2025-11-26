/**
 * Vercel API Route: Create Payment Intent for Existing Custom Tour
 * Creates Stripe PaymentIntent for an existing custom tour request
 * POST /api/custom/:id/payment-intent
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { withSentry, logError } from '../../../utils/sentry.js';

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
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Supabase credentials missing'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Initialize Stripe
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Stripe credentials missing'
            });
        }

        const stripe = new Stripe(stripeSecretKey);

        // Get tour ID from URL (Vercel dynamic route)
        // URL format: /api/custom/[id]/payment-intent
        const tourId = req.query.id;

        if (!tourId) {
            return res.status(400).json({
                success: false,
                message: 'Tour ID is required'
            });
        }

        // Fetch custom tour request
        const { data: tourRequest, error: fetchError } = await supabase
            .from('custom_tour_requests')
            .select('*')
            .eq('id', tourId)
            .single();

        if (fetchError || !tourRequest) {
            return res.status(404).json({
                success: false,
                message: 'Custom tour request not found'
            });
        }

        // Check if tour is in a valid state for payment
        if (tourRequest.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'This tour has already been paid'
            });
        }

        if (tourRequest.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This tour has been cancelled'
            });
        }

        // Apply 10% discount
        const discountAmount = Math.round(tourRequest.totalPrice * 0.1);
        const discountedPrice = tourRequest.totalPrice - discountAmount;

        // Check if payment already exists
        const { data: existingPayment } = await supabase
            .from('custom_tour_payments')
            .select('*')
            .eq('customTourId', tourId)
            .eq('paymentStatus', 'succeeded')
            .maybeSingle();

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'Payment already exists for this tour'
            });
        }

        // Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: discountedPrice,
            currency: 'usd',
            metadata: {
                customTourId: tourId,
                userId: tourRequest.userId || 'guest',
                type: 'custom_tour',
                originalPrice: tourRequest.totalPrice.toString(),
                discountAmount: discountAmount.toString(),
                travelers: tourRequest.travelers.toString()
            },
            description: `Custom Busan Tour - ${tourRequest.itinerary?.locations?.length || 0} locations, ${tourRequest.travelers} traveler(s)`
        });

        // Create or update payment record
        const { error: paymentInsertError } = await supabase
            .from('custom_tour_payments')
            .upsert({
                customTourId: tourId,
                stripePaymentIntentId: paymentIntent.id,
                amount: discountedPrice,
                paymentStatus: 'failed' // Will be updated to 'succeeded' via webhook
            }, {
                onConflict: 'customTourId'
            });

        if (paymentInsertError) {
            console.error('Error creating payment record:', paymentInsertError);
            // Don't fail the request, but log the error
        }

        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: discountedPrice,
            originalAmount: tourRequest.totalPrice,
            discountAmount: discountAmount
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);
        logError(error, {
            extra: { endpoint: '/api/custom/:id/payment-intent', tourId: req.query.id }
        });
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again.'
        });
    }
}

export default withSentry(handler);

