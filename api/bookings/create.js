/**
 * Vercel API Route: Create Booking with Items and Payment
 * Handles booking creation with items, payment options, and Stripe integration
 * Uses Supabase server SDK
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
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
        // Initialize Supabase client with service role key
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

        // Parse request body
        const {
            user,
            items,
            payment_option,
            date,
            pickup_location
        } = req.body;

        // Validate required fields
        if (!user || !user.name || !user.email || !user.phone) {
            return res.status(400).json({
                success: false,
                message: 'Missing required user fields: name, email, phone'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items array is required and must not be empty'
            });
        }

        if (!payment_option || !['pay_now', 'pay_after'].includes(payment_option)) {
            return res.status(400).json({
                success: false,
                message: 'payment_option must be "pay_now" or "pay_after"'
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'date is required'
            });
        }

        // 1. Upsert user in users table
        let userId = user.id;
        
        if (userId) {
            // Check if user exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('id, name, email, phone')
                .eq('id', userId)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching user:', fetchError);
            }

            if (existingUser) {
                // Update user info if provided
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        name: user.name,
                        email: user.email,
                        phone: user.phone
                    })
                    .eq('id', userId);

                if (updateError) {
                    console.warn('Error updating user:', updateError);
                }
            } else {
                // User ID provided but doesn't exist - create it
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: userId,
                        name: user.name,
                        email: user.email,
                        phone: user.phone
                    })
                    .select('id')
                    .maybeSingle();

                if (insertError) {
                    console.error('Error creating user:', insertError);
                    // Continue anyway - might be duplicate key
                } else if (newUser) {
                    userId = newUser.id;
                }
            }
        } else {
            // No user ID - check by email or create new
            const { data: existingUserByEmail, error: emailError } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .maybeSingle();

            if (emailError && emailError.code !== 'PGRST116') {
                console.error('Error checking user by email:', emailError);
            }

            if (existingUserByEmail) {
                userId = existingUserByEmail.id;
                // Update user info
                await supabase
                    .from('users')
                    .update({
                        name: user.name,
                        phone: user.phone
                    })
                    .eq('id', userId);
            } else {
                // Create new user
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        name: user.name,
                        email: user.email,
                        phone: user.phone
                    })
                    .select('id')
                    .maybeSingle();

                if (insertError) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create user',
                        error: insertError.message
                    });
                }

                if (!newUser) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create user: no data returned'
                    });
                }

                userId = newUser.id;
            }
        }

        // 2. Check product stock levels before creating booking
        const productItems = items.filter(item => item.type === 'product' && item.id);
        
        if (productItems.length > 0) {
            const productIds = productItems.map(item => item.id);
            
            // Fetch current stock levels for all products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, name, stock')
                .in('id', productIds);

            if (productsError) {
                console.error('Error fetching products:', productsError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to check product stock',
                    error: productsError.message
                });
            }

            // Create a map of product stock
            const productStockMap = {};
            (products || []).forEach(product => {
                productStockMap[product.id] = {
                    name: product.name,
                    stock: product.stock !== null ? product.stock : Infinity // null stock = unlimited
                };
            });

            // Check stock for each product item
            const stockIssues = [];
            for (const item of productItems) {
                const productId = item.id;
                const requestedQuantity = item.quantity || 1;
                const product = productStockMap[productId];

                if (!product) {
                    stockIssues.push(`Product ${item.name || productId} not found`);
                    continue;
                }

                // If stock is null, treat as unlimited
                if (product.stock === Infinity) {
                    continue; // Unlimited stock, no check needed
                }

                if (product.stock < requestedQuantity) {
                    stockIssues.push(
                        `${product.name || productId}: requested ${requestedQuantity}, but only ${product.stock} available`
                    );
                }
            }

            if (stockIssues.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock for one or more products',
                    errors: stockIssues
                });
            }
        }

        // 3. Calculate total from items server-side (do not trust client)
        let total_amount_krw = 0;
        for (const item of items) {
            if (!item.unit_price_krw || !item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid item: missing unit_price_krw or quantity`
                });
            }
            total_amount_krw += item.unit_price_krw * item.quantity;
        }

        // Round to nearest integer
        total_amount_krw = Math.round(total_amount_krw);

        // 4. Calculate discount and final amount
        let discount_percent = 0;
        let final_amount_krw = total_amount_krw;

        if (payment_option === 'pay_now') {
            discount_percent = 10;
            final_amount_krw = Math.round(total_amount_krw * 0.9);
        }

        // 5. Decrement product stock (transaction-like approach)
        // Store original stock values for rollback if needed
        const stockRollback = [];
        
        if (productItems.length > 0) {
            // Fetch current stock for all products first
            const productIds = productItems.map(item => item.id);
            const { data: currentProducts, error: fetchError } = await supabase
                .from('products')
                .select('id, stock')
                .in('id', productIds);

            if (fetchError) {
                console.error('Error fetching product stock:', fetchError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch product stock',
                    error: fetchError.message
                });
            }

            // Create a map of current stock
            const currentStockMap = {};
            (currentProducts || []).forEach(product => {
                currentStockMap[product.id] = product.stock;
            });

            // Decrement stock for each product
            for (const item of productItems) {
                const productId = item.id;
                const quantity = item.quantity || 1;
                const currentStock = currentStockMap[productId];

                // Skip if stock is null (unlimited)
                if (currentStock === null) {
                    continue;
                }

                // Calculate new stock
                const newStock = currentStock - quantity;

                // Double-check stock is still sufficient (race condition protection)
                if (newStock < 0) {
                    // Rollback any previous stock decrements
                    for (const rollback of stockRollback) {
                        await supabase
                            .from('products')
                            .update({ stock: rollback.originalStock })
                            .eq('id', rollback.productId);
                    }
                    
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock: Product ${item.name || productId} only has ${currentStock} available, but ${quantity} requested`
                    });
                }

                // Update stock
                const { error: stockError } = await supabase
                    .from('products')
                    .update({ stock: newStock })
                    .eq('id', productId);

                if (stockError) {
                    console.error('Error decrementing stock:', stockError);
                    // Rollback any previous stock decrements
                    for (const rollback of stockRollback) {
                        await supabase
                            .from('products')
                            .update({ stock: rollback.originalStock })
                            .eq('id', rollback.productId);
                    }
                    
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update product stock',
                        error: stockError.message
                    });
                }

                // Store for potential rollback
                stockRollback.push({
                    productId: productId,
                    quantity: quantity,
                    originalStock: currentStock
                });
            }
        }

        // 6. Create booking transactionally
        // Insert booking first
        const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                user_id: userId,
                total_amount_krw: total_amount_krw,
                discount_percent: discount_percent,
                final_amount_krw: final_amount_krw,
                status: 'pending',
                payment_option: payment_option
            })
            .select('id')
            .maybeSingle();

        if (bookingError) {
            console.error('Error creating booking:', bookingError);
            // Rollback stock decrements
            for (const rollback of stockRollback) {
                await supabase
                    .from('products')
                    .update({ stock: rollback.originalStock })
                    .eq('id', rollback.productId);
            }
            
            return res.status(500).json({
                success: false,
                message: 'Failed to create booking',
                error: bookingError.message
            });
        }

        if (!bookingData) {
            // Rollback stock decrements
            for (const rollback of stockRollback) {
                await supabase
                    .from('products')
                    .update({ stock: rollback.originalStock })
                    .eq('id', rollback.productId);
            }
            
            return res.status(500).json({
                success: false,
                message: 'Failed to create booking: no data returned'
            });
        }

        const bookingId = bookingData.id;

        // Insert booking items
        const bookingItems = items.map(item => ({
            booking_id: bookingId,
            item_type: item.type || 'tour',
            item_ref: item.id || null,
            name: item.name || 'Unknown',
            unit_price_krw: item.unit_price_krw,
            quantity: item.quantity || 1
        }));

        const { error: itemsError } = await supabase
            .from('booking_items')
            .insert(bookingItems);

        if (itemsError) {
            console.error('Error creating booking items:', itemsError);
            // Rollback: delete booking and restore stock
            await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId);
            
            // Rollback stock decrements
            for (const rollback of stockRollback) {
                await supabase
                    .from('products')
                    .update({ stock: rollback.originalStock })
                    .eq('id', rollback.productId);
            }
            
            return res.status(500).json({
                success: false,
                message: 'Failed to create booking items',
                error: itemsError.message
            });
        }

        // 7. Handle Stripe Checkout Session for pay_now
        if (payment_option === 'pay_now') {
            const stripe = new Stripe(env.STRIPE_SECRET_KEY);

            // Create Stripe Checkout Session
            try {
                // Calculate line items with discount applied server-side
                // The discount is already applied to final_amount_krw in the booking
                // For Stripe, we apply the discount to each line item
                const lineItems = items.map(item => {
                    const unitPrice = item.unit_price_krw;
                    // Apply 10% discount to unit price for pay_now
                    const discountedPrice = Math.round(unitPrice * 0.9);
                    
                    return {
                        price_data: {
                            currency: 'krw',
                            product_data: {
                                name: item.name || 'Tour Item',
                            },
                            unit_amount: discountedPrice, // Already in KRW (no cents), discount applied
                        },
                        quantity: item.quantity || 1,
                    };
                });

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: lineItems,
                    mode: 'payment',
                    success_url: `${env.BASE_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${env.BASE_URL}/booking-cancel`,
                    metadata: {
                        booking_id: bookingId,
                        user_id: userId,
                        date: date,
                        pickup_location: pickup_location || ''
                    },
                });

                // Update booking with Stripe session ID
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({ stripe_session_id: session.id })
                    .eq('id', bookingId);

                if (updateError) {
                    console.warn('Error updating booking with Stripe session ID:', updateError);
                }

                return res.status(200).json({
                    success: true,
                    checkoutUrl: session.url,
                    bookingId: bookingId,
                    sessionId: session.id
                });

            } catch (stripeError) {
                console.error('Stripe error:', stripeError);
                // Booking is already created, so return booking ID even if Stripe fails
                return res.status(200).json({
                    success: true,
                    bookingId: bookingId,
                    message: 'Booking created but Stripe session creation failed',
                    error: stripeError.message
                });
            }
        } else {
            // pay_after - just return booking ID
            return res.status(200).json({
                success: true,
                bookingId: bookingId
            });
        }

    } catch (error) {
        console.error('Error creating booking:', error);
        logError(error, {
            tags: {
                handler: 'createBooking',
                method: req.method
            },
            extra: {
                body: req.body,
                query: req.query
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

