/**
 * Integration tests for booking creation and Stripe checkout
 */

import { jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Mock environment variables
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
                })),
                in: jest.fn(() => Promise.resolve({ data: [], error: null }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ 
                        data: { id: 'test-booking-id' }, 
                        error: null 
                    }))
                }))
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            })),
            delete: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
        }))
    }))
}));

// Mock Stripe
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
        checkout: {
            sessions: {
                create: jest.fn(() => Promise.resolve({
                    id: 'cs_test_123',
                    url: 'https://checkout.stripe.com/test'
                }))
            }
        },
        webhooks: {
            constructEvent: jest.fn((body, signature, secret) => ({
                id: 'evt_test_123',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_123',
                        payment_intent: 'pi_test_123',
                        metadata: {
                            booking_id: 'test-booking-id',
                            user_id: 'test-user-id'
                        }
                    }
                }
            }))
        }
    }));
});

describe('Booking Creation Tests', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock request object
        mockReq = {
            method: 'POST',
            body: {
                user: {
                    id: 'test-user-id',
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: '+82-10-1234-5678'
                },
                items: [
                    {
                        type: 'tour',
                        id: 'hidden-gems',
                        name: 'Busan Hidden Gems Tour',
                        unit_price_krw: 289000,
                        quantity: 2
                    }
                ],
                payment_option: 'pay_now',
                date: '2025-12-01',
                pickup_location: 'Haeundae Beach'
            },
            headers: {}
        };

        // Mock response object
        mockRes = {
            status: jest.fn(() => mockRes),
            json: jest.fn(() => mockRes),
            setHeader: jest.fn(() => mockRes),
            end: jest.fn(() => mockRes)
        };
    });

    test('should create booking with pay_now option', async () => {
        // Import the handler dynamically
        const handler = (await import('../api/bookings/create.js')).default;

        // Mock Supabase responses
        const mockSupabase = createClient();
        const mockFrom = mockSupabase.from;
        
        // Mock user upsert
        mockFrom.mockReturnValueOnce({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ 
                        data: { id: 'test-user-id' }, 
                        error: null 
                    }))
                }))
            }))
        });

        // Mock products check (no products in this test)
        mockFrom.mockReturnValueOnce({
            select: jest.fn(() => ({
                in: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
        });

        // Mock booking creation
        mockFrom.mockReturnValueOnce({
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ 
                        data: { id: 'test-booking-id' }, 
                        error: null 
                    }))
                }))
            }))
        });

        // Mock booking items creation
        mockFrom.mockReturnValueOnce({
            insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
        });

        // Mock booking update with Stripe session
        mockFrom.mockReturnValueOnce({
            update: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
        });

        await handler(mockReq, mockRes);

        // Verify response
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                checkoutUrl: expect.any(String),
                bookingId: expect.any(String)
            })
        );
    });

    test('should return 400 for insufficient product stock', async () => {
        const handler = (await import('../api/bookings/create.js')).default;

        // Add product with insufficient stock
        mockReq.body.items.push({
            type: 'product',
            id: 'test-product-id',
            name: 'Test Product',
            unit_price_krw: 50000,
            quantity: 10
        });

        // Mock Supabase responses
        const mockSupabase = createClient();
        const mockFrom = mockSupabase.from;
        
        // Mock user
        mockFrom.mockReturnValueOnce({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ 
                        data: { id: 'test-user-id' }, 
                        error: null 
                    }))
                }))
            }))
        });

        // Mock products check - return product with stock = 5
        mockFrom.mockReturnValueOnce({
            select: jest.fn(() => ({
                in: jest.fn(() => Promise.resolve({ 
                    data: [{ 
                        id: 'test-product-id', 
                        name: 'Test Product', 
                        stock: 5 
                    }], 
                    error: null 
                }))
            }))
        });

        await handler(mockReq, mockRes);

        // Verify error response
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.stringContaining('Insufficient stock')
            })
        );
    });

    test('should create booking with pay_after option', async () => {
        const handler = (await import('../api/bookings/create.js')).default;

        mockReq.body.payment_option = 'pay_after';

        // Mock Supabase responses
        const mockSupabase = createClient();
        const mockFrom = mockSupabase.from;
        
        // Mock user
        mockFrom.mockReturnValueOnce({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ 
                        data: { id: 'test-user-id' }, 
                        error: null 
                    }))
                }))
            }))
        });

        // Mock products check
        mockFrom.mockReturnValueOnce({
            select: jest.fn(() => ({
                in: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
        });

        // Mock booking creation
        mockFrom.mockReturnValueOnce({
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ 
                        data: { id: 'test-booking-id' }, 
                        error: null 
                    }))
                }))
            }))
        });

        // Mock booking items creation
        mockFrom.mockReturnValueOnce({
            insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
        });

        await handler(mockReq, mockRes);

        // Verify response
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                bookingId: expect.any(String)
            })
        );
    });
});

describe('Stripe Webhook Tests', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            method: 'POST',
            headers: {
                'stripe-signature': 'test-signature'
            },
            body: Buffer.from(JSON.stringify({
                id: 'evt_test_123',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_123',
                        payment_intent: 'pi_test_123',
                        metadata: {
                            booking_id: 'test-booking-id'
                        }
                    }
                }
            })),
            on: jest.fn((event, callback) => {
                if (event === 'data') {
                    callback(mockReq.body);
                } else if (event === 'end') {
                    callback();
                }
            })
        };

        mockRes = {
            status: jest.fn(() => mockRes),
            json: jest.fn(() => mockRes),
            setHeader: jest.fn(() => mockRes)
        };
    });

    test('should log webhook event to stripe_events table', async () => {
        const handler = (await import('../api/stripe/webhook.js')).default;

        // Mock Supabase
        const mockSupabase = createClient();
        const mockFrom = mockSupabase.from;
        
        let eventLogInserted = false;

        // Mock event logging
        mockFrom.mockReturnValueOnce({
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    maybeSingle: jest.fn(() => {
                        eventLogInserted = true;
                        return Promise.resolve({ 
                            data: { id: 'event-log-id' }, 
                            error: null 
                        });
                    })
                }))
            }))
        });

        // Mock booking fetch
        mockFrom.mockReturnValueOnce({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ 
                        data: { 
                            id: 'test-booking-id',
                            user_id: 'test-user-id',
                            status: 'pending'
                        }, 
                        error: null 
                    }))
                }))
            }))
        });

        // Mock booking update
        mockFrom.mockReturnValueOnce({
            update: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
        });

        // Mock event log update
        mockFrom.mockReturnValueOnce({
            update: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
        });

        // Mock user fetch
        mockFrom.mockReturnValueOnce({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ 
                        data: { email: 'test@example.com', name: 'Test User' }, 
                        error: null 
                    }))
                }))
            }))
        });

        // Mock booking items fetch
        mockFrom.mockReturnValueOnce({
            select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
        });

        await handler(mockReq, mockRes);

        // Verify event was logged
        expect(eventLogInserted).toBe(true);
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });
});

