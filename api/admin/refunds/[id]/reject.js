/**
 * Vercel API Route: Admin - Reject Refund
 * POST /api/admin/refunds/:id/reject
 * Rejects a refund request
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
        // Check admin authorization
        const adminEmail = process.env.ADMIN_EMAIL;
        const userEmail = req.headers['x-user-email'] || req.body?.email;

        if (!adminEmail || userEmail !== adminEmail) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Admin access required'
            });
        }

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

        // Get refund ID from URL
        const refundId = req.query.id;
        const { rejectionReason } = req.body || {};

        if (!refundId) {
            return res.status(400).json({
                success: false,
                message: 'Refund ID is required'
            });
        }

        // Fetch refund
        const { data: refund, error: refundError } = await supabase
            .from('refunds')
            .select('id, status')
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

        // Update refund status to rejected
        const { error: updateError } = await supabase
            .from('refunds')
            .update({
                status: 'rejected',
                reason: rejectionReason ? `${refund.reason || ''} [REJECTED: ${rejectionReason}]` : refund.reason
            })
            .eq('id', refundId);

        if (updateError) {
            console.error('Error updating refund:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to reject refund',
                error: updateError.message
            });
        }

        // Log admin action
        console.log(`[ADMIN ACTION] Refund ${refundId} rejected by ${userEmail} at ${new Date().toISOString()}`);

        return res.status(200).json({
            success: true,
            message: 'Refund rejected',
            refund: {
                id: refundId,
                status: 'rejected'
            }
        });

    } catch (error) {
        console.error('Error rejecting refund:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

