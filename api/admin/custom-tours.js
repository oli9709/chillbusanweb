/**
 * Vercel API Route: Get All Custom Tours (Admin)
 * GET /api/admin/custom-tours
 * Returns all custom tour requests for admin panel
 */

import { createClient } from '@supabase/supabase-js';
import { withSentry, logError } from '../../utils/sentry.js';
import { env } from '../../utils/env.js';

async function handler(req, res) {
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

        // Get status filter from query
        const statusFilter = req.query.status;

        // Build query
        let query = supabase
            .from('custom_tour_requests')
            .select('*');

        // Apply status filter if provided
        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }

        // Fetch custom tour requests
        const { data: customTours, error: fetchError } = await query
            .order('createdAt', { ascending: false });

        if (fetchError) {
            console.error('Error fetching custom tours:', fetchError);
            logError(new Error('Failed to fetch custom tours'), {
                extra: { fetchError }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch custom tours'
            });
        }

        // Fetch user emails for each tour
        const toursWithUsers = await Promise.all(
            (customTours || []).map(async (tour) => {
                let userEmail = 'Guest';
                let userName = 'Guest';

                if (tour.userId) {
                    const { data: user } = await supabase
                        .from('users')
                        .select('email, name')
                        .eq('id', tour.userId)
                        .maybeSingle();

                    if (user) {
                        userEmail = user.email || 'Unknown';
                        userName = user.name || userEmail;
                    }
                }

                return {
                    id: tour.id,
                    userId: tour.userId,
                    userEmail: userEmail,
                    userName: userName,
                    date: tour.startTime,
                    totalPrice: tour.totalPrice,
                    status: tour.status,
                    createdAt: tour.createdAt,
                    itinerary: tour.itinerary,
                    travelers: tour.travelers,
                    durationHours: tour.durationHours,
                    addons: tour.addons
                };
            })
        );

        return res.status(200).json({
            success: true,
            customTours: toursWithUsers
        });

    } catch (error) {
        console.error('Get custom tours error:', error);
        logError(error, {
            extra: { endpoint: '/api/admin/custom-tours' }
        });
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
}

export default withSentry(handler);

