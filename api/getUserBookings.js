/**
 * Vercel API Route: Get User Bookings
 * Retrieves bookings for a specific user using Supabase
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET
    if (req.method !== 'GET') {
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

        // Get authenticated user from Vercel request
        // Try multiple ways to get user ID
        const userId = req?.headers['x-user-id'] || 
                      req?.user?.id || 
                      req?.query?.userId || 
                      null;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required. Please authenticate or provide userId in query parameters.'
            });
        }

        console.log('Fetching bookings for user:', userId);

        // Fetch bookings from Supabase using user_id
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('id, name, email, phone, tour, date, people, addons, total_price, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching bookings:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch bookings',
                error: error.message
            });
        }

        // Gracefully handle no data state
        if (!bookings || bookings.length === 0) {
            return res.status(200).json({
                success: true,
                bookings: [],
                status: 'unused'
            });
        }

        return res.status(200).json({
            success: true,
            bookings: bookings
        });

    } catch (error) {
        console.error('Error fetching user bookings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
}

