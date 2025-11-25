/**
 * Script to test Sentry integration
 * Run: node SENTRY_TEST_SCRIPT.js
 */

import { logError, logMessage } from './utils/sentry.js';

// Test error logging
console.log('Testing Sentry error logging...');
const testError = new Error('Sentry integration test error');
logError(testError, {
    tags: {
        test: 'sentry_integration',
        source: 'manual_test'
    },
    extra: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    }
});

// Test message logging
console.log('Testing Sentry message logging...');
logMessage('Sentry integration test message', {
    level: 'info',
    tags: {
        test: 'sentry_integration',
        source: 'manual_test'
    }
});

console.log('✅ Sentry test events sent! Check your Sentry dashboard.');
