/**
 * Vercel API Route: Consume Welcome Discount
 * Marks the first booking discount as used for a user
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
        // Initialize Supabase client with service role key
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Supabase credentials missing'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get authenticated user from Vercel request (preferred)
        // Try multiple ways to get user ID
        let userId = req?.headers['x-user-id'] || 
                    req?.user?.id || 
                    req?.body?.userId || 
                    null;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required. Please authenticate or provide userId in request body.'
            });
        }
        
        // Update users table to mark discount as used
        // Use .maybeSingle() to handle cases where user doesn't exist
        const { data: updateData, error } = await supabase
            .from('users')
            .update({ first_booking_discount: false })
            .eq('id', userId)
            .select()
            .maybeSingle();
        
        if (error) {
            console.error('Error updating discount status:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to consume discount',
                error: error.message
            });
        }

        // Gracefully handle no data state
        if (!updateData) {
            return res.status(200).json({
                success: false,
                status: 'unused',
                message: 'User not found or discount already consumed'
            });
        }

        console.log(`Discount consumed for user: ${userId}`);
        
        return res.status(200).json({
            success: true,
            message: 'Discount consumed successfully',
            data: updateData
        });

    } catch (error) {
        console.error('Error consuming discount:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to consume discount',
            error: error.message
        });
    }
}

