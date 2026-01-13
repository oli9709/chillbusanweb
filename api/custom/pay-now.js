/**
 * Vercel API Route: Custom Tour Pay Now
 * Creates custom tour request and Stripe PaymentIntent with 10% discount
 * POST /api/custom/pay-now
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { withSentry, logError } from '../../utils/sentry.js';
import { sendCustomTourEmail } from '../../utils/customTourEmailTemplates.js';
import { env } from '../../utils/env.js';

// Server-side price calculation
function calculatePrice(selectedLocations, addons) {
    const LOCATION_PRICE = 50; // $50 per location
    const ADDON_PRICES = {
        drone: 50,
        photographer: 75,
        pickup: 30
    };

    const locationTotal = selectedLocations.length * LOCATION_PRICE;
    const addonTotal = addons.reduce((sum, addon) => {
        return sum + (ADDON_PRICES[addon] || 0);
    }, 0);

    const basePrice = locationTotal;
    const totalPrice = locationTotal + addonTotal;

    return {
        basePrice: basePrice * 100, // Convert to cents
        addonTotal: addonTotal * 100,
        totalPrice: totalPrice * 100,
        locationTotal: locationTotal * 100
    };
}

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

        // Initialize Stripe
        const stripe = new Stripe(env.STRIPE_SECRET_KEY);

        // Parse and validate request body
        const {
            selectedLocations,
            addons = [],
            travelers,
            startTime,
            durationHours,
            totalPrice: clientTotalPrice,
            notes = '',
            paymentOption = 'pay_now'
        } = req.body;

        // Validation
        if (!selectedLocations || !Array.isArray(selectedLocations) || selectedLocations.length < 4 || selectedLocations.length > 5) {
            return res.status(400).json({
                success: false,
                message: 'Please select 4-5 locations for your custom tour'
            });
        }

        if (!travelers || travelers < 1 || travelers > 10) {
            return res.status(400).json({
                success: false,
                message: 'Number of travelers must be between 1 and 10'
            });
        }

        if (!startTime) {
            return res.status(400).json({
                success: false,
                message: 'Start time is required'
            });
        }

        if (!durationHours || durationHours < 4 || durationHours > 8) {
            return res.status(400).json({
                success: false,
                message: 'Duration must be between 4 and 8 hours'
            });
        }

        // Server-side price recalculation
        const calculatedPrices = calculatePrice(selectedLocations, addons);
        const serverTotalPrice = calculatedPrices.totalPrice;

        // Validate client price matches server calculation (allow small difference for rounding)
        const priceDifference = Math.abs(clientTotalPrice * 100 - serverTotalPrice);
        if (priceDifference > 100) { // Allow $1 difference
            console.warn(`Price mismatch: client=${clientTotalPrice * 100}, server=${serverTotalPrice}`);
            // Use server-calculated price for security
        }

        // Apply 10% discount for pay_now
        const discountAmount = Math.round(serverTotalPrice * 0.1);
        const discountedPrice = serverTotalPrice - discountAmount;

        // Get user ID from auth if available
        const userId = req.headers['x-user-id'] || req.body.userId || null;

        // Prepare itinerary JSON
        const itinerary = {
            locations: selectedLocations,
            startTime: startTime,
            durationHours: durationHours
        };

        // Prepare addons JSON
        const addonsJson = addons.length > 0 ? { items: addons } : null;

        // Create custom tour request in database
        const { data: tourRequest, error: insertError } = await supabase
            .from('custom_tour_requests')
            .insert({
                userId: userId,
                itinerary: itinerary,
                travelers: travelers,
                startTime: startTime,
                durationHours: durationHours,
                basePrice: calculatedPrices.basePrice,
                addons: addonsJson,
                totalPrice: serverTotalPrice,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating custom tour request:', insertError);
            logError(new Error('Failed to create custom tour request'), {
                extra: { insertError, itinerary, travelers }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to create tour request. Please try again.'
            });
        }

        // Create Stripe PaymentIntent
        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.create({
                amount: discountedPrice, // Amount in cents with 10% discount
                currency: 'usd',
                metadata: {
                    customTourId: tourRequest.id,
                    userId: userId || 'guest',
                    type: 'custom_tour',
                    originalPrice: serverTotalPrice.toString(),
                    discountAmount: discountAmount.toString(),
                    travelers: travelers.toString()
                },
                description: `Custom Busan Tour - ${selectedLocations.length} locations, ${travelers} traveler(s)`
            });
        } catch (stripeError) {
            console.error('Stripe PaymentIntent creation error:', stripeError);
            logError(stripeError, {
                extra: { customTourId: tourRequest.id, amount: discountedPrice }
            });
            
            // Delete the tour request if Stripe fails
            await supabase
                .from('custom_tour_requests')
                .delete()
                .eq('id', tourRequest.id);

            return res.status(500).json({
                success: false,
                message: 'Failed to initialize payment. Please try again.'
            });
        }

        // Create payment record
        const { error: paymentInsertError } = await supabase
            .from('custom_tour_payments')
            .insert({
                customTourId: tourRequest.id,
                stripePaymentIntentId: paymentIntent.id,
                amount: discountedPrice,
                paymentStatus: 'failed' // Will be updated to 'succeeded' via webhook
            });

        if (paymentInsertError) {
            console.error('Error creating payment record:', paymentInsertError);
            // Don't fail the request, but log the error
        }

        // Send admin email alert (request received)
        try {
            // Get user info if available
            let userEmail = null;
            let userName = 'Guest';
            if (userId) {
                const { data: user } = await supabase
                    .from('users')
                    .select('email, name')
                    .eq('id', userId)
                    .maybeSingle();
                if (user) {
                    userEmail = user.email;
                    userName = user.name || userEmail?.split('@')[0] || 'Guest';
                }
            }
            
            await sendCustomTourEmail(env.SUPPORT_EMAIL, 'request_received', tourRequest, userEmail, userName);
        } catch (emailError) {
            console.error('Error sending admin email:', emailError);
            // Don't fail the request if email fails
        }

        // Return success with client secret
        return res.status(200).json({
            success: true,
            bookingId: tourRequest.id,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: discountedPrice,
            originalAmount: serverTotalPrice,
            discountAmount: discountAmount
        });

    } catch (error) {
        console.error('Pay Now error:', error);
        logError(error, {
            extra: { endpoint: '/api/custom/pay-now', body: req.body }
        });
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again.'
        });
    }
}

export default withSentry(handler);

