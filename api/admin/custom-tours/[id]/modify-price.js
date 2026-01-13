/**
 * Vercel API Route: Modify Custom Tour Price
 * POST /api/admin/custom-tours/:id/modify-price
 * Updates custom tour price and sends email to user
 */

import { createClient } from '@supabase/supabase-js';
import { withSentry, logError } from '../../../../utils/sentry.js';
import { sendCustomTourEmail } from '../../../../utils/customTourEmailTemplates.js';
import { env } from '../../../../utils/env.js';

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
        // Check admin authentication
        const adminEmail = req.query.email || req.headers['x-user-email'];

        if (!adminEmail || adminEmail !== env.SUPPORT_EMAIL) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Admin access required'
            });
        }

        // Initialize Supabase
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

        // Get tour ID from URL
        const tourId = req.query.id;

        if (!tourId) {
            return res.status(400).json({
                success: false,
                message: 'Tour ID is required'
            });
        }

        // Parse new price from body (in USD, convert to cents)
        const { newPrice } = req.body || {};

        if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid new price is required (in USD)'
            });
        }

        // Convert USD to cents
        const newPriceCents = Math.round(parseFloat(newPrice) * 100);

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

        const oldPriceCents = tourRequest.totalPrice;
        const oldPriceUSD = (oldPriceCents / 100).toFixed(2);

        // Update price
        const { error: updateError } = await supabase
            .from('custom_tour_requests')
            .update({ totalPrice: newPriceCents })
            .eq('id', tourId);

        if (updateError) {
            console.error('Error updating price:', updateError);
            logError(new Error('Failed to update custom tour price'), {
                extra: { tourId, newPriceCents, updateError }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to update price'
            });
        }

        // Get user email
        let userEmail = null;
        if (tourRequest.userId) {
            const { data: user } = await supabase
                .from('users')
                .select('email, name')
                .eq('id', tourRequest.userId)
                .maybeSingle();

            if (user) {
                userEmail = user.email;
            }
        }

        // Send price modification email
        if (userEmail) {
            try {
                const { data: user } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', tourRequest.userId)
                    .maybeSingle();
                
                const userName = user?.name || userEmail.split('@')[0];
                const newPriceUSD = (newPriceCents / 100).toFixed(2);
                const priceChange = newPriceCents - oldPriceCents;
                const priceChangeUSD = (Math.abs(priceChange) / 100).toFixed(2);
                const isIncrease = priceChange > 0;
                const reason = `Price updated: ${isIncrease ? 'increased' : 'decreased'} by $${priceChangeUSD} USD`;
                
                // Use custom tour email template (cancelled template with price change reason)
                await sendCustomTourEmail(userEmail, 'cancelled', tourRequest, userEmail, userName, { reason });
            } catch (emailError) {
                console.error('Error sending price modification email:', emailError);
                // Don't fail the request if email fails
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Price updated successfully',
            oldPrice: oldPriceCents,
            newPrice: newPriceCents
        });

    } catch (error) {
        console.error('Modify price error:', error);
        logError(error, {
            extra: { endpoint: '/api/admin/custom-tours/:id/modify-price', tourId: req.query.id }
        });
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
}

export default withSentry(handler);

