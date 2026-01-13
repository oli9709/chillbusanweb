/**
 * Auth Guard Utility
 * Protects pages and redirects based on authentication state
 */

/**
 * Check if user is authenticated
 * @returns {Promise<{authenticated: boolean, user: Object|null}>}
 */
async function checkAuth() {
    try {
        // Wait for Supabase to be available
        if (typeof window.supabaseAuth === 'undefined') {
            // Retry a few times
            for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 200));
                if (typeof window.supabaseAuth !== 'undefined') break;
            }
            
            if (typeof window.supabaseAuth === 'undefined') {
                return { authenticated: false, user: null };
            }
        }

        const supabase = window.supabaseAuth.getSupabase();
        if (!supabase) {
            // Wait a bit and retry
            await new Promise(resolve => setTimeout(resolve, 200));
            const retrySupabase = window.supabaseAuth.getSupabase();
            if (!retrySupabase) {
                return { authenticated: false, user: null };
            }
            const { data: { session }, error } = await retrySupabase.auth.getSession();
            if (error || !session || !session.user) {
                return { authenticated: false, user: null };
            }
            return { authenticated: true, user: session.user };
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session || !session.user) {
            return { authenticated: false, user: null };
        }

        return { authenticated: true, user: session.user };
    } catch (error) {
        console.error('Auth check error:', error);
        return { authenticated: false, user: null };
    }
}

/**
 * Protect a page - redirect to login if not authenticated
 * @param {string} redirectTo - Where to redirect after login (optional)
 */
async function protectPage(redirectTo = null) {
    const { authenticated, user } = await checkAuth();
    
    if (!authenticated) {
        const redirect = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
        window.location.replace(`/login.html${redirect}`);
        return null;
    }
    
    return user;
}

/**
 * Redirect authenticated users away from auth pages (login/signup)
 * @param {string} redirectTo - Where to redirect (default: dashboard)
 */
async function redirectIfAuthenticated(redirectTo = '/dashboard.html') {
    const { authenticated } = await checkAuth();
    
    if (authenticated) {
        window.location.replace(redirectTo);
        return true;
    }
    
    return false;
}

/**
 * Initialize auth guard for a page
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAuth - Require authentication (default: false)
 * @param {boolean} options.redirectIfAuth - Redirect if already authenticated (default: false)
 * @param {string} options.redirectTo - Where to redirect authenticated users (default: dashboard)
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise
 */
async function initAuthGuard(options = {}) {
    const {
        requireAuth = false,
        redirectIfAuth = false,
        redirectTo = '/dashboard.html'
    } = options;

    // Wait for DOM and Supabase to be ready
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    // Wait a bit for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if we should redirect authenticated users (for login/signup pages)
    if (redirectIfAuth) {
        const redirected = await redirectIfAuthenticated(redirectTo);
        if (redirected) {
            return null; // Will redirect, so return null
        }
    }

    // Check if we need to protect this page
    if (requireAuth) {
        const user = await protectPage(window.location.pathname);
        return user;
    }

    // Just return current auth state
    const { user } = await checkAuth();
    return user;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.authGuard = {
        checkAuth,
        protectPage,
        redirectIfAuthenticated,
        initAuthGuard
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuth,
        protectPage,
        redirectIfAuthenticated,
        initAuthGuard
    };
}

