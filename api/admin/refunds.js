/**
 * Vercel API Route: Admin - Get Refund Requests
 * GET /api/admin/refunds
 * Returns all refund requests
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

        // Fetch refunds
        const { data: refunds, error } = await supabase
            .from('refunds')
            .select('id, booking_id, stripe_refund_id, amount_krw, status, reason, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching refunds:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch refunds',
                error: error.message
            });
        }

        if (!refunds || refunds.length === 0) {
            return res.status(200).json({
                success: true,
                refunds: [],
                count: 0
            });
        }

        // Fetch bookings for these refunds
        const bookingIds = refunds.map(r => r.booking_id);
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, user_id, final_amount_krw, status, stripe_payment_intent')
            .in('id', bookingIds);

        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
        }

        // Fetch users for these bookings
        const userIds = [...new Set((bookings || []).map(b => b.user_id).filter(Boolean))];
        let users = {};
        if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, email, name')
                .in('id', userIds);

            if (!usersError && usersData) {
                usersData.forEach(u => {
                    users[u.id] = u;
                });
            }
        }

        // Combine refunds with booking and user info
        const bookingsMap = {};
        (bookings || []).forEach(b => {
            bookingsMap[b.id] = b;
        });

        // Format refunds data
        const formattedRefunds = (refunds || []).map(refund => {
            const booking = bookingsMap[refund.booking_id];
            const user = booking ? users[booking.user_id] : null;
            
            return {
                id: refund.id,
                bookingId: refund.booking_id,
                stripeRefundId: refund.stripe_refund_id,
                amountKrw: refund.amount_krw || 0,
                status: refund.status || 'pending',
                reason: refund.reason || '',
                createdAt: refund.created_at,
                booking: {
                    id: booking?.id || refund.booking_id,
                    userId: booking?.user_id || '',
                    finalAmountKrw: booking?.final_amount_krw || 0,
                    status: booking?.status || '',
                    stripePaymentIntent: booking?.stripe_payment_intent || '',
                    userEmail: user?.email || '',
                    userName: user?.name || ''
                }
            };
        });

        return res.status(200).json({
            success: true,
            refunds: formattedRefunds,
            count: formattedRefunds.length
        });

    } catch (error) {
        console.error('Error in admin refunds endpoint:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

