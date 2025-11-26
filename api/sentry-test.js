/**
 * Vercel API Route: Sentry Test Endpoint
 * POST /api/sentry-test
 * Tests Sentry error tracking and message logging
 */

import { withSentry, logError, logMessage } from '../../utils/sentry.js';

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
        // Parse request body (Vercel may send as string or buffer)
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        } else if (Buffer.isBuffer(body)) {
            body = JSON.parse(body.toString());
        }
        
        const { test, message, context } = body || {};

        if (!test) {
            return res.status(400).json({
                success: false,
                message: 'Test type is required'
            });
        }

        switch (test) {
            case 'error':
                // Trigger a test error
                const testError = new Error('Sentry Integration Test Error - This is a test error to verify Sentry is working');
                logError(testError, {
                    tags: {
                        test: 'sentry_verification',
                        source: 'api_test',
                        handler: 'sentryTest'
                    },
                    extra: {
                        timestamp: new Date().toISOString(),
                        testType: 'error',
                        environment: process.env.NODE_ENV || 'development'
                    }
                });
                
                return res.status(200).json({
                    success: true,
                    message: 'Test error triggered and logged to Sentry',
                    error: testError.message
                });

            case 'message':
                // Send a custom message
                const customMessage = message || 'Sentry Integration Test Message - This is a test message to verify Sentry is working';
                logMessage(customMessage, {
                    level: 'info',
                    tags: {
                        test: 'sentry_verification',
                        source: 'api_test',
                        handler: 'sentryTest'
                    },
                    extra: {
                        timestamp: new Date().toISOString(),
                        testType: 'message',
                        environment: process.env.NODE_ENV || 'development'
                    }
                });
                
                return res.status(200).json({
                    success: true,
                    message: 'Test message sent to Sentry',
                    sentMessage: customMessage
                });

            case 'context':
                // Trigger error with context
                const contextError = new Error('Sentry Integration Test Error with Context - This error includes additional context data');
                logError(contextError, {
                    tags: {
                        test: 'sentry_verification',
                        source: 'api_test',
                        handler: 'sentryTest',
                        hasContext: 'true'
                    },
                    extra: {
                        timestamp: new Date().toISOString(),
                        testType: 'context',
                        environment: process.env.NODE_ENV || 'development',
                        ...(context || {})
                    }
                });
                
                return res.status(200).json({
                    success: true,
                    message: 'Test error with context triggered and logged to Sentry',
                    error: contextError.message,
                    context: context || {}
                });

            default:
                return res.status(400).json({
                    success: false,
                    message: `Unknown test type: ${test}. Use 'error', 'message', or 'context'`
                });
        }

    } catch (error) {
        console.error('Sentry test endpoint error:', error);
        // This will also be captured by Sentry via withSentry wrapper
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

// Export handler wrapped with Sentry
export default withSentry(handler);

