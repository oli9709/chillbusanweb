/**
 * Direct Sentry Test Script
 * Run: node test-sentry.js
 * This will trigger a test error to Sentry
 */

import { logError, logMessage } from './utils/sentry.js';

console.log('🧪 Testing Sentry Integration...\n');

// Check if SENTRY_DSN is set
if (!process.env.SENTRY_DSN) {
    console.error('❌ ERROR: SENTRY_DSN environment variable is not set!');
    console.log('\n📝 To fix this:');
    console.log('1. Get your Sentry DSN from: https://sentry.io → Your Project → Settings → Client Keys (DSN)');
    console.log('2. Set it in Vercel: Dashboard → Settings → Environment Variables');
    console.log('3. Or set it locally: export SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"');
    console.log('4. Then run this script again\n');
    process.exit(1);
}

console.log('✅ SENTRY_DSN is set');
console.log('📤 Sending test error to Sentry...\n');

// Test 1: Send a test error
const testError = new Error('Sentry Integration Test - This is a test error to verify Sentry is working correctly');
logError(testError, {
    tags: {
        test: 'sentry_verification',
        source: 'test_script',
        timestamp: new Date().toISOString()
    },
    extra: {
        testType: 'manual_verification',
        environment: process.env.NODE_ENV || 'development',
        script: 'test-sentry.js'
    }
});

console.log('✅ Test error sent!');
console.log('📤 Sending test message to Sentry...\n');

// Test 2: Send a test message
logMessage('Sentry Integration Test Message - This is a test message to verify Sentry is working correctly', {
    level: 'info',
    tags: {
        test: 'sentry_verification',
        source: 'test_script',
        timestamp: new Date().toISOString()
    },
    extra: {
        testType: 'manual_verification',
        environment: process.env.NODE_ENV || 'development',
        script: 'test-sentry.js'
    }
});

console.log('✅ Test message sent!');
console.log('\n📊 Next Steps:');
console.log('1. Go to your Sentry Dashboard: https://sentry.io');
console.log('2. Navigate to: Issues');
console.log('3. Look for errors with tag: test=sentry_verification');
console.log('4. You should see the error within 10-30 seconds');
console.log('\n✅ If you see the error in Sentry, integration is working!');
console.log('❌ If you don\'t see it, check:');
console.log('   - SENTRY_DSN is correct');
console.log('   - Sentry project is active');
console.log('   - Wait 10-30 seconds (events are batched)');

