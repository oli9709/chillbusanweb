/**
 * Supabase Client Configuration
 * Handles authentication and database operations
 */

// Supabase client initialization
let supabaseClient = null;

/**
 * Initialize Supabase client
 * @returns {Object} Supabase client instance
 */
function initSupabase() {
    if (supabaseClient) {
        return supabaseClient;
    }

    const supabaseUrl = window.SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = window.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
        return null;
    }

    // Check if Supabase is available (from CDN)
    if (typeof window !== 'undefined') {
        // If window.supabase exists and has createClient method
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            return supabaseClient;
        }
        
        // If Supabase library is loaded but not yet available, wait a bit
        // This handles async CDN loading
        if (document.readyState === 'loading') {
            // Document still loading, Supabase might not be ready yet
            return null;
        }
    }

    // Not available yet
    return null;
}

/**
 * Get current Supabase client
 * @returns {Object} Supabase client instance
 */
function getSupabase() {
    if (!supabaseClient) {
        const client = initSupabase();
        if (!client && typeof window !== 'undefined' && window.supabase) {
            // If Supabase CDN is loaded but client not initialized, initialize now
            const supabaseUrl = window.SUPABASE_URL || process.env.SUPABASE_URL;
            const supabaseAnonKey = window.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseAnonKey && typeof window.supabase.createClient === 'function') {
                supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
                return supabaseClient;
            }
        }
        return client;
    }
    return supabaseClient;
}

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User full name
 * @returns {Promise<Object>} Signup result
 */
async function signUp(email, password, fullName) {
    const supabase = getSupabase();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }

    try {
        // Track signup attempt
        if (typeof window !== 'undefined' && window.trackEvent) {
            window.trackEvent('user_signup_attempted', { email: email.substring(0, 5) + '***' });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;

        // Track successful signup
        if (typeof window !== 'undefined' && window.trackEvent) {
            window.trackEvent('user_signed_up', { 
                user_id: data.user?.id?.substring(0, 8) || 'unknown',
                has_discount: true 
            });
        }

        // Create user record in users table with welcome discount
        if (data.user) {
            const discountExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days from now
            
            const { data: insertData, error: dbError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: data.user.email,
                    full_name: fullName,
                    first_booking_discount: true,
                    discount_expiry: discountExpiry
                })
                .select();

            if (dbError) {
                // If duplicate key error, user already exists - update discount if needed
                if (dbError.code === '23505') {
                    console.log('User already exists in database, checking discount status...');
                    // Check if user needs discount reset
                    const { data: existingUserData } = await supabase
                        .from('users')
                        .select('first_booking_discount, discount_expiry')
                        .eq('id', data.user.id)
                        .limit(1);
                    
                    const existingUser = existingUserData?.[0] ?? null;
                    
                    // If discount expired or used, don't update
                    if (existingUser && !existingUser.first_booking_discount) {
                        console.log('User already used discount, not resetting');
                    }
                } else {
                    console.error('Error creating user record:', dbError);
                }
            } else {
                console.log('User record created with welcome discount (expires in 60 days)');
            }
        }

        return { data, error: null };
    } catch (error) {
        console.error('Signup error:', error);
        return { data: null, error };
    }
}

/**
 * Sign in a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Signin result
 */
async function signIn(email, password) {
    const supabase = getSupabase();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }

    try {
        // Track login attempt
        if (typeof window !== 'undefined' && window.trackEvent) {
            window.trackEvent('user_login_attempted', { email: email.substring(0, 5) + '***' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        
        // Track successful login
        if (typeof window !== 'undefined' && window.trackEvent) {
            window.trackEvent('user_logged_in', { 
                user_id: data.user?.id?.substring(0, 8) || 'unknown'
            });
        }
        
        return { data, error: null };
    } catch (error) {
        console.error('Signin error:', error);
        return { data: null, error };
    }
}

/**
 * Sign out current user
 * @returns {Promise<Object>} Signout result
 */
async function signOut() {
    const supabase = getSupabase();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }

    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Signout error:', error);
        return { error };
    }
}

/**
 * Get current user
 * @returns {Promise<Object>} Current user data
 */
async function getCurrentUser() {
    const supabase = getSupabase();
    if (!supabase) {
        return { user: null, error: 'Supabase client not initialized' };
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return { user, error: null };
    } catch (error) {
        return { user: null, error };
    }
}

/**
 * Reset password (forgot password)
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset password result
 */
async function resetPassword(email) {
    const supabase = getSupabase();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Reset password error:', error);
        return { data: null, error };
    }
}

/**
 * Get user discount status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Discount status
 */
async function getUserDiscountStatus(userId) {
    const supabase = getSupabase();
    if (!supabase) {
        return { hasDiscount: false, discountExpiry: null, error: 'Supabase client not initialized' };
    }

    try {
        const { data: userData, error } = await supabase
            .from('users')
            .select('first_booking_discount, discount_expiry')
            .eq('id', userId)
            .limit(1);

        if (error) {
            throw error;
        }

        // If user doesn't exist in users table, create it
        const user = userData?.[0] ?? null;
        
        if (!user) {
            // User exists in auth but not in users table - create record
            const { data: authData } = await supabase.auth.getUser();
            if (authData?.user) {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: authData.user.id,
                        email: authData.user.email,
                        full_name: authData.user.user_metadata?.full_name || '',
                        first_booking_discount: true,
                        discount_expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
                    });
                
                if (!insertError) {
                    return {
                        hasDiscount: true,
                        discountExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                        error: null
                    };
                }
            }
            
            // If we couldn't create the user record, return no discount
            return {
                hasDiscount: false,
                discountExpiry: null,
                error: null
            };
        }

        const hasDiscount = user.first_booking_discount && 
                           new Date(user.discount_expiry) > new Date();

        return {
            hasDiscount,
            discountExpiry: user.discount_expiry,
            error: null
        };
    } catch (error) {
        console.error('Get discount status error:', error);
        return { hasDiscount: false, discountExpiry: null, error };
    }
}

/**
 * Consume first booking discount
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
async function consumeDiscount(userId) {
    const supabase = getSupabase();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }

    try {
        const { data: updateData, error } = await supabase
            .from('users')
            .update({ first_booking_discount: false })
            .eq('id', userId)
            .select();

        if (error) throw error;
        
        // Return first item or null if no rows updated
        return { data: updateData?.[0] ?? null, error: null };
    } catch (error) {
        console.error('Consume discount error:', error);
        return { data: null, error };
    }
}

// Export functions
if (typeof window !== 'undefined') {
    window.supabaseAuth = {
        initSupabase,
        getSupabase,
        signUp,
        signIn,
        signOut,
        getCurrentUser,
        resetPassword,
        getUserDiscountStatus,
        consumeDiscount
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSupabase,
        getSupabase,
        signUp,
        signIn,
        signOut,
        getCurrentUser,
        resetPassword,
        getUserDiscountStatus,
        consumeDiscount
    };
}

