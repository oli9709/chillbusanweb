/**
 * Vercel API Route: Approve Custom Tour
 * POST /api/admin/custom-tours/:id/approve
 * Approves a custom tour request and sends email to user
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

        // Update status to approved
        const { error: updateError } = await supabase
            .from('custom_tour_requests')
            .update({ status: 'approved' })
            .eq('id', tourId);

        if (updateError) {
            console.error('Error approving tour:', updateError);
            logError(new Error('Failed to approve custom tour'), {
                extra: { tourId, updateError }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to approve tour'
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

        // Send approval email
        if (userEmail) {
            try {
                const { data: user } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', tourRequest.userId)
                    .maybeSingle();
                
                const userName = user?.name || userEmail.split('@')[0];
                await sendCustomTourEmail(userEmail, 'approved', tourRequest, userEmail, userName);
            } catch (emailError) {
                console.error('Error sending approval email:', emailError);
                // Don't fail the request if email fails
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Tour approved successfully'
        });

    } catch (error) {
        console.error('Approve tour error:', error);
        logError(error, {
            extra: { endpoint: '/api/admin/custom-tours/:id/approve', tourId: req.query.id }
        });
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
}

export default withSentry(handler);

