/**
 * Vercel API Route: Create Booking
 * POST /api/booking/create
 * Creates a new booking with PENDING payment status
 */

import { createClient } from '@supabase/supabase-js';
import { withSentry, logError } from '../../utils/sentry.js';
import { env } from '../../utils/env.js';

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
        // Initialize Supabase
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

        // Parse and validate request body
        const {
            customerName,
            customerEmail,
            tourType,
            tourDate,
            price
        } = req.body;

        // Validate required fields
        if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'customerName is required and must be a non-empty string'
            });
        }

        if (!customerEmail || typeof customerEmail !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'customerEmail is required and must be a string'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        if (!tourType || typeof tourType !== 'string' || tourType.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'tourType is required and must be a non-empty string'
            });
        }

        if (!tourDate || typeof tourDate !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'tourDate is required and must be a string (YYYY-MM-DD format)'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(tourDate)) {
            return res.status(400).json({
                success: false,
                message: 'tourDate must be in YYYY-MM-DD format'
            });
        }

        // Validate date is not in the past
        const selectedDate = new Date(tourDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: 'tourDate cannot be in the past'
            });
        }

        if (price === undefined || price === null) {
            return res.status(400).json({
                success: false,
                message: 'price is required'
            });
        }

        // Validate price is a positive number
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'price must be a positive number'
            });
        }

        // Generate unique booking ID
        const bookingId = `CBT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // Create booking in database
        const { data: booking, error: insertError } = await supabase
            .from('bookings_new')
            .insert({
                bookingId: bookingId,
                customerName: customerName.trim(),
                customerEmail: customerEmail.trim().toLowerCase(),
                tourType: tourType.trim(),
                tourDate: tourDate,
                price: priceNum,
                paymentStatus: 'pending'
            })
            .select('id, bookingId, customerName, customerEmail, tourType, tourDate, price, paymentStatus, createdAt')
            .single();

        if (insertError) {
            console.error('Error creating booking:', insertError);
            logError(insertError, {
                tags: {
                    handler: 'bookingCreate',
                    action: 'insertBooking'
                },
                extra: {
                    customerEmail: customerEmail,
                    tourType: tourType,
                    tourDate: tourDate
                }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to create booking',
                error: insertError.message
            });
        }

        if (!booking) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create booking: no data returned'
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            booking: {
                id: booking.id,
                bookingId: booking.bookingId,
                customerName: booking.customerName,
                customerEmail: booking.customerEmail,
                tourType: booking.tourType,
                tourDate: booking.tourDate,
                price: booking.price,
                paymentStatus: booking.paymentStatus,
                createdAt: booking.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        logError(error, {
            tags: {
                handler: 'bookingCreate',
                method: req.method
            },
            extra: {
                body: req.body
            }
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

// Export handler wrapped with Sentry
export default withSentry(handler);

