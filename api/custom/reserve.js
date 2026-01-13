/**
 * Vercel API Route: Custom Tour Reserve (Pay After)
 * Creates custom tour request without payment
 * POST /api/custom/reserve
 */

import { createClient } from '@supabase/supabase-js';
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

        // Parse and validate request body
        const {
            selectedLocations,
            addons = [],
            travelers,
            startTime,
            durationHours,
            totalPrice: clientTotalPrice,
            notes = '',
            paymentOption = 'pay_after'
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

        // Return success with booking ID
        return res.status(200).json({
            success: true,
            bookingId: tourRequest.id,
            message: 'Tour reservation created successfully. You will pay after the tour.'
        });

    } catch (error) {
        console.error('Reserve error:', error);
        logError(error, {
            extra: { endpoint: '/api/custom/reserve', body: req.body }
        });
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again.'
        });
    }
}

export default withSentry(handler);

