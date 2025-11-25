/**
 * Vercel API Route: Download Booking PDF
 * GET /api/bookings/:id/download-pdf
 * Generates and returns a PDF ticket for the booking
 */

import { createClient } from '@supabase/supabase-js';
import { generateBookingPDF } from '../../../utils/generateBookingPDF.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/pdf');

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
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Supabase credentials missing'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get booking ID from URL parameter
        const bookingId = req.query.id;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID is required'
            });
        }

        // Fetch booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id, user_id, total_amount_krw, discount_percent, final_amount_krw, status, payment_option, created_at, name, email, phone')
            .eq('id', bookingId)
            .maybeSingle();
        
        // Fetch user info separately if not in booking
        let userInfo = { name: booking?.name || '', email: booking?.email || '', phone: booking?.phone || '' };
        if (booking?.user_id && (!userInfo.name || !userInfo.email)) {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('name, email, phone')
                .eq('id', booking.user_id)
                .maybeSingle();
            if (!userError && user) {
                userInfo = { name: user.name || userInfo.name, email: user.email || userInfo.email, phone: user.phone || userInfo.phone };
            }
        }

        if (bookingError) {
            console.error('Error fetching booking:', bookingError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch booking',
                error: bookingError.message
            });
        }

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Fetch booking items
        const { data: items, error: itemsError } = await supabase
            .from('booking_items')
            .select('name, unit_price_krw, quantity, item_type')
            .eq('booking_id', bookingId);

        if (itemsError) {
            console.error('Error fetching booking items:', itemsError);
        }

        // Prepare booking details for PDF
        const bookingDetails = {
            bookingId: booking.id,
            customerName: userInfo.name || 'Guest',
            customerEmail: userInfo.email || '',
            phone: userInfo.phone || '',
            tourName: items?.find(item => item.item_type === 'tour')?.name || items?.[0]?.name || 'Tour',
            tourDate: booking.created_at ? new Date(booking.created_at).toISOString().split('T')[0] : '',
            numberOfGuests: items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 1,
            addons: items?.filter(item => item.item_type !== 'tour').map(item => `${item.name} x${item.quantity}`).join(', ') || '',
            totalPrice: booking.final_amount_krw || booking.total_amount_krw || 0,
            meetingLocation: 'Haeundae Beach or as specified',
            discountApplied: (booking.discount_percent || 0) > 0,
            discountAmount: booking.discount_percent ? Math.round((booking.total_amount_krw || 0) * (booking.discount_percent / 100)) : 0,
            originalPrice: booking.total_amount_krw || 0
        };

        // Generate PDF
        const pdfBuffer = await generateBookingPDF(bookingDetails);

        // Return PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="booking-${bookingId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        return res.status(200).send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate PDF',
            error: error.message
        });
    }
}

