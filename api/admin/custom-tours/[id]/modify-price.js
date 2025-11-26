/**
 * Vercel API Route: Modify Custom Tour Price
 * POST /api/admin/custom-tours/:id/modify-price
 * Updates custom tour price and sends email to user
 */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { withSentry, logError } from '../../../../utils/sentry.js';

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || 'chilltours.official@gmail.com',
            pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD
        }
    });
};

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
        // Check admin authentication
        const adminEmail = req.query.email || req.headers['x-user-email'];
        const expectedAdminEmail = process.env.ADMIN_EMAIL || 'chilltours.official@gmail.com';

        if (!adminEmail || adminEmail !== expectedAdminEmail) {
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

        // Get tour ID from URL
        const tourId = req.query.id;

        if (!tourId) {
            return res.status(400).json({
                success: false,
                message: 'Tour ID is required'
            });
        }

        // Parse new price from body (in USD, convert to cents)
        const { newPrice } = req.body || {};

        if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid new price is required (in USD)'
            });
        }

        // Convert USD to cents
        const newPriceCents = Math.round(parseFloat(newPrice) * 100);

        // Fetch custom tour request
        const { data: tourRequest, error: fetchError } = await supabase
            .from('custom_tour_requests')
            .select('*')
            .eq('id', tourId)
            .single();

        if (fetchError || !tourRequest) {
            return res.status(404).json({
                success: false,
                message: 'Custom tour request not found'
            });
        }

        const oldPriceCents = tourRequest.totalPrice;
        const oldPriceUSD = (oldPriceCents / 100).toFixed(2);

        // Update price
        const { error: updateError } = await supabase
            .from('custom_tour_requests')
            .update({ totalPrice: newPriceCents })
            .eq('id', tourId);

        if (updateError) {
            console.error('Error updating price:', updateError);
            logError(new Error('Failed to update custom tour price'), {
                extra: { tourId, newPriceCents, updateError }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to update price'
            });
        }

        // Get user email
        let userEmail = null;
        if (tourRequest.userId) {
            const { data: user } = await supabase
                .from('users')
                .select('email, name')
                .eq('id', tourRequest.userId)
                .maybeSingle();

            if (user) {
                userEmail = user.email;
            }
        }

        // Send price modification email
        if (userEmail) {
            try {
                const transporter = createTransporter();
                const newPriceUSD = (newPriceCents / 100).toFixed(2);
                const priceChange = newPriceCents - oldPriceCents;
                const priceChangeUSD = (Math.abs(priceChange) / 100).toFixed(2);
                const isIncrease = priceChange > 0;

                await transporter.sendMail({
                    from: `"Chill Busan Tours" <${process.env.EMAIL_USER || 'chilltours.official@gmail.com'}>`,
                    to: userEmail,
                    subject: `Price Update for Your Custom Tour Request`,
                    html: `
                        <h2>Price Update for Your Custom Tour</h2>
                        <p>Dear ${userEmail.split('@')[0]},</p>
                        <p>We wanted to inform you that the price for your custom tour request (ID: ${tourId.substring(0, 8)}...) has been updated.</p>
                        
                        <h3>Price Details:</h3>
                        <ul>
                            <li><strong>Previous Price:</strong> $${oldPriceUSD} USD</li>
                            <li><strong>New Price:</strong> $${newPriceUSD} USD</li>
                            <li><strong>Change:</strong> ${isIncrease ? '+' : '-'}$${priceChangeUSD} USD</li>
                        </ul>
                        
                        <p>You can view the updated price and proceed with payment in your dashboard:</p>
                        <p><a href="${process.env.BASE_URL || 'https://chillbusantours.com'}/dashboard?tab=custom" style="display: inline-block; padding: 12px 24px; background: #4A90E2; color: white; text-decoration: none; border-radius: 8px; margin-top: 10px;">View in Dashboard</a></p>
                        
                        <p>If you have any questions about this price change, please don't hesitate to contact us.</p>
                        <p>Best regards,<br>Chill Busan Tours Team</p>
                    `
                });
            } catch (emailError) {
                console.error('Error sending price modification email:', emailError);
                // Don't fail the request if email fails
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Price updated successfully',
            oldPrice: oldPriceCents,
            newPrice: newPriceCents
        });

    } catch (error) {
        console.error('Modify price error:', error);
        logError(error, {
            extra: { endpoint: '/api/admin/custom-tours/:id/modify-price', tourId: req.query.id }
        });
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
}

export default withSentry(handler);

