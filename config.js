/**
 * Configuration file for Chill Busan Tours
 * Environment variables are injected at build time by Vercel
 * For local development, set these in .env.local or use fallback values
 */

// Supabase Configuration
// In Vercel, set these environment variables:
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
window.SUPABASE_URL = window.SUPABASE_URL || 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    'https://bvarcwjloubxagszzkqf.supabase.co';

window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXJjd2psb3VieGFnc3p6a3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTM1MzYsImV4cCI6MjA3OTQ2OTUzNn0.wu05PiXH2UvU0O9ExWqCKMPIRpItFiazDavS-PXSmJo';

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_URL: window.SUPABASE_URL,
        SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY
    };
}

