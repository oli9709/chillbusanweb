/**
 * Vercel API Route: Cancel Custom Tour
 * Cancels a custom tour request
 * POST /api/custom/:id/cancel
 */

import { createClient } from '@supabase/supabase-js';
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

        // Get tour ID from URL (Vercel dynamic route)
        // URL format: /api/custom/[id]/cancel
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

        // Check if tour can be cancelled
        if (tourRequest.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a paid tour. Please request a refund instead.'
            });
        }

        if (tourRequest.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This tour is already cancelled'
            });
        }

        // Update status to cancelled
        const { error: updateError } = await supabase
            .from('custom_tour_requests')
            .update({ status: 'cancelled' })
            .eq('id', tourId);

        if (updateError) {
            console.error('Error cancelling tour:', updateError);
            logError(new Error('Failed to cancel custom tour'), {
                extra: { tourId, updateError }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to cancel tour. Please try again.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tour cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel tour error:', error);
        logError(error, {
            extra: { endpoint: '/api/custom/:id/cancel', tourId: req.query.id }
        });
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again.'
        });
    }
}

export default withSentry(handler);

