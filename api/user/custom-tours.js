/**
 * Vercel API Route: Get User Custom Tours
 * Fetches custom tour requests for a specific user
 * GET /api/user/custom-tours
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
        // Initialize Supabase
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

        // Get user ID from query params or headers
        const userId = req.query.userId || req.headers['x-user-id'];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Fetch custom tour requests for user
        const { data: customTours, error: fetchError } = await supabase
            .from('custom_tour_requests')
            .select('*')
            .eq('userId', userId)
            .order('createdAt', { ascending: false });

        if (fetchError) {
            console.error('Error fetching custom tours:', fetchError);
            logError(new Error('Failed to fetch custom tours'), {
                extra: { userId, fetchError }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch custom tours'
            });
        }

        // Return consistent JSON format
        if (!customTours || customTours.length === 0) {
            return res.status(200).json({
                success: true,
                customTours: []
            });
        }

        // Format response with itinerary preview
        const formattedTours = customTours.map(tour => {
            const itinerary = tour.itinerary || {};
            const locations = itinerary.locations || [];
            const addons = tour.addons?.items || [];

            return {
                id: tour.id,
                itinerary: {
                    locations: locations,
                    startTime: itinerary.startTime || tour.startTime,
                    durationHours: itinerary.durationHours || tour.durationHours
                },
                travelers: tour.travelers,
                startTime: tour.startTime,
                durationHours: tour.durationHours,
                basePrice: tour.basePrice,
                addons: addons,
                totalPrice: tour.totalPrice,
                status: tour.status,
                createdAt: tour.createdAt,
                updatedAt: tour.updatedAt
            };
        });

        return res.status(200).json({
            success: true,
            customTours: formattedTours
        });

    } catch (error) {
        console.error('Get custom tours error:', error);
        logError(error, {
            extra: { endpoint: '/api/user/custom-tours', query: req.query }
        });
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
}

export default withSentry(handler);

