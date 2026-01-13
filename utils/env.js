/**
 * Centralized Environment Variable Configuration
 * All environment variables should be accessed through this module
 * Throws errors if required variables are missing
 */

/**
 * Get environment variable with validation
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Optional default value
 * @param {boolean} required - Whether the variable is required
 * @returns {string} Environment variable value
 * @throws {Error} If required variable is missing
 */
function getEnv(key, defaultValue = undefined, required = true) {
    const value = process.env[key] || defaultValue;
    
    if (required && (value === undefined || value === '')) {
        throw new Error(`Missing ENV: ${key}`);
    }
    
    return value;
}

/**
 * Environment configuration object
 * All sensitive variables are accessed through this
 */
export const env = {
    // Stripe
    STRIPE_SECRET_KEY: getEnv('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: getEnv('STRIPE_WEBHOOK_SECRET'),
    
    // Supabase
    SUPABASE_URL: getEnv('SUPABASE_URL'),
    SUPABASE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    
    // SMTP/Email
    SMTP_HOST: getEnv('SMTP_HOST', 'smtp.gmail.com', false),
    SMTP_PORT: getEnv('SMTP_PORT', '587', false),
    SMTP_USER: getEnv('SMTP_USER', 'chilltours.official@gmail.com', false),
    SMTP_PASSWORD: getEnv('SMTP_PASSWORD', undefined, false),
    
    // Sentry
    SENTRY_DSN: getEnv('SENTRY_DSN', undefined, false),
    
    // Support/Admin
    SUPPORT_EMAIL: getEnv('SUPPORT_EMAIL', 'chilltours.official@gmail.com', false),
    
    // Application
    BASE_URL: getEnv('BASE_URL', 'https://chillbusantours.com', false),
};

export default env;

