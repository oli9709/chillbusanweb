/**
 * Vercel API Route: Get User Bookings with Nested Items
 * GET /api/users/:id/bookings
 * Returns bookings with nested items array
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../../../utils/env.js';

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
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

        // Get user ID from URL parameter
        const userId = req.query.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required in URL path: /api/users/:id/bookings'
            });
        }

        console.log('Fetching bookings for user:', userId);

        // Fetch bookings for the user
        // Select all relevant columns (handles both old and new schema)
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, total_amount_krw, discount_percent, final_amount_krw, status, payment_option, total_price, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch bookings',
                error: bookingsError.message
            });
        }

        // If no bookings, return empty array in consistent format
        if (!bookings || bookings.length === 0) {
            return res.status(200).json({
                success: true,
                bookings: []
            });
        }

        // Fetch all booking items for these bookings
        const bookingIds = bookings.map(b => b.id);
        
        const { data: items, error: itemsError } = await supabase
            .from('booking_items')
            .select('id, booking_id, item_type, name, unit_price_krw, quantity')
            .in('booking_id', bookingIds);

        if (itemsError) {
            console.error('Error fetching booking items:', itemsError);
            // Continue without items rather than failing
        }

        // Group items by booking_id
        const itemsByBookingId = {};
        if (items) {
            for (const item of items) {
                if (!itemsByBookingId[item.booking_id]) {
                    itemsByBookingId[item.booking_id] = [];
                }
                itemsByBookingId[item.booking_id].push({
                    id: item.id,
                    item_type: item.item_type,
                    name: item.name,
                    unit_price_krw: item.unit_price_krw,
                    quantity: item.quantity
                });
            }
        }

        // Combine bookings with their items
        // Handle both old and new schema gracefully
        const bookingsWithItems = bookings.map(booking => ({
            id: booking.id,
            total_amount_krw: booking.total_amount_krw ?? booking.total_price ?? 0,
            discount_percent: booking.discount_percent ?? 0,
            final_amount_krw: booking.final_amount_krw ?? booking.total_amount_krw ?? booking.total_price ?? 0,
            status: booking.status ?? 'pending',
            payment_option: booking.payment_option ?? 'pay_after',
            created_at: booking.created_at,
            items: itemsByBookingId[booking.id] || []
        }));

        // Return consistent JSON format
        return res.status(200).json({
            success: true,
            bookings: bookingsWithItems
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

