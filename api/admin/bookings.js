/**
 * Vercel API Route: Admin - Get All Bookings with Filters
 * GET /api/admin/bookings?status=pending&payment_option=pay_now
 * Returns all bookings with optional filters
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
        // Check admin authorization
        const adminEmail = process.env.ADMIN_EMAIL;
        const userEmail = req.headers['x-user-email'] || req.query.email;

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

        // Get filters from query params
        const { status, payment_option } = req.query;

        // Build query
        let query = supabase
            .from('bookings')
            .select(`
                id,
                user_id,
                total_amount_krw,
                discount_percent,
                final_amount_krw,
                status,
                payment_option,
                stripe_session_id,
                stripe_payment_intent,
                created_at,
                users!inner(email, name, phone)
            `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }
        if (payment_option) {
            query = query.eq('payment_option', payment_option);
        }

        const { data: bookings, error } = await query;

        if (error) {
            console.error('Error fetching bookings:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch bookings',
                error: error.message
            });
        }

        // Fetch booking items for each booking
        const bookingIds = bookings?.map(b => b.id) || [];
        let itemsByBookingId = {};

        if (bookingIds.length > 0) {
            const { data: items, error: itemsError } = await supabase
                .from('booking_items')
                .select('booking_id, name, unit_price_krw, quantity, item_type')
                .in('booking_id', bookingIds);

            if (!itemsError && items) {
                items.forEach(item => {
                    if (!itemsByBookingId[item.booking_id]) {
                        itemsByBookingId[item.booking_id] = [];
                    }
                    itemsByBookingId[item.booking_id].push(item);
                });
            }
        }

        // Combine bookings with items
        const bookingsWithItems = (bookings || []).map(booking => ({
            id: booking.id,
            userId: booking.user_id,
            userEmail: booking.users?.email || '',
            userName: booking.users?.name || '',
            userPhone: booking.users?.phone || '',
            totalAmountKrw: booking.total_amount_krw || 0,
            discountPercent: booking.discount_percent || 0,
            finalAmountKrw: booking.final_amount_krw || booking.total_amount_krw || 0,
            status: booking.status || 'pending',
            paymentOption: booking.payment_option || 'pay_after',
            stripeSessionId: booking.stripe_session_id,
            stripePaymentIntent: booking.stripe_payment_intent,
            createdAt: booking.created_at,
            items: itemsByBookingId[booking.id] || []
        }));

        return res.status(200).json({
            success: true,
            bookings: bookingsWithItems,
            count: bookingsWithItems.length
        });

    } catch (error) {
        console.error('Error in admin bookings endpoint:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

