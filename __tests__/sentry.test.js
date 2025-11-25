/**
 * Test Sentry integration
 */

import { jest } from '@jest/globals';

// Mock Sentry
const mockCaptureException = jest.fn();
const mockCaptureMessage = jest.fn();
const mockSetContext = jest.fn();
const mockInit = jest.fn();

jest.mock('@sentry/node', () => ({
    init: mockInit,
    captureException: mockCaptureException,
    captureMessage: mockCaptureMessage,
    setContext: mockSetContext
}));

describe('Sentry Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Set SENTRY_DSN for tests
        process.env.SENTRY_DSN = 'https://test@sentry.io/test';
    });

    afterEach(() => {
        delete process.env.SENTRY_DSN;
    });

    test('should initialize Sentry when DSN is provided', async () => {
        // Re-import to trigger initialization
        await import('../utils/sentry.js');
        expect(mockInit).toHaveBeenCalled();
    });

    test('should log errors to Sentry', async () => {
        const { logError } = await import('../utils/sentry.js');
        
        const testError = new Error('Test error');
        logError(testError, {
            tags: { test: 'true' },
            extra: { data: 'test' }
        });

        expect(mockCaptureException).toHaveBeenCalledWith(
            testError,
            expect.objectContaining({
                tags: { test: 'true' },
                extra: { data: 'test' }
            })
        );
    });

    test('should log messages to Sentry', async () => {
        const { logMessage } = await import('../utils/sentry.js');
        
        logMessage('Test message', {
            level: 'info',
            tags: { test: 'true' }
        });

        expect(mockCaptureMessage).toHaveBeenCalledWith(
            'Test message',
            expect.objectContaining({
                level: 'info',
                tags: { test: 'true' }
            })
        );
    });

    test('should send test error event', async () => {
        const { logError } = await import('../utils/sentry.js');
        
        const testError = new Error('Sentry test error');
        logError(testError, {
            tags: {
                test: 'sentry_integration',
                source: 'test_suite'
            }
        });

        expect(mockCaptureException).toHaveBeenCalled();
    });
});

