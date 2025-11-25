/**
 * Sentry initialization and error tracking
 * For Vercel serverless functions
 */

import * as Sentry from '@sentry/node';

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        debug: process.env.NODE_ENV === 'development',
        beforeSend(event, hint) {
            // Filter out sensitive data
            if (event.request) {
                // Remove sensitive headers
                if (event.request.headers) {
                    delete event.request.headers['authorization'];
                    delete event.request.headers['x-api-key'];
                    delete event.request.headers['stripe-signature'];
                }
            }
            return event;
        }
    });
}

/**
 * Wrap API handler with Sentry error tracking
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler
 */
export function withSentry(handler) {
    return async (req, res) => {
        try {
            // Set up Sentry context
            if (process.env.SENTRY_DSN) {
                Sentry.setContext('request', {
                    method: req.method,
                    url: req.url,
                    headers: {
                        'user-agent': req.headers['user-agent'],
                        'content-type': req.headers['content-type']
                    }
                });
            }

            // Execute handler
            return await handler(req, res);
        } catch (error) {
            // Capture exception in Sentry
            if (process.env.SENTRY_DSN) {
                Sentry.captureException(error, {
                    tags: {
                        handler: handler.name || 'unknown',
                        method: req.method,
                        path: req.url
                    },
                    extra: {
                        body: req.body,
                        query: req.query
                    }
                });
            }

            // Re-throw to let handler handle it
            throw error;
        }
    };
}

/**
 * Log an error to Sentry
 * @param {Error} error - Error to log
 * @param {Object} context - Additional context
 */
export function logError(error, context = {}) {
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
            tags: context.tags || {},
            extra: context.extra || {},
            level: context.level || 'error'
        });
    }
    console.error('Error logged to Sentry:', error, context);
}

/**
 * Log a message to Sentry
 * @param {string} message - Message to log
 * @param {Object} context - Additional context
 */
export function logMessage(message, context = {}) {
    if (process.env.SENTRY_DSN) {
        Sentry.captureMessage(message, {
            level: context.level || 'info',
            tags: context.tags || {},
            extra: context.extra || {}
        });
    }
    console.log('Message logged to Sentry:', message, context);
}

export default Sentry;

