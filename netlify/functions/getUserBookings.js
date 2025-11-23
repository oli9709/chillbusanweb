/**
 * Netlify Function: Get User Bookings
 * Retrieves bookings for a specific user using Supabase
 */

const { createClient } = require('@supabase/supabase-js');

module.exports.handler = async (event) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow GET
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Method not allowed'
            })
        };
    }

    try {
        // Initialize Supabase client with service role key
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Server configuration error: Supabase credentials missing'
                })
            };
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get authenticated user from Netlify context
        const { user } = event.clientContext || {};
        const userId = user?.sub; // Supabase user ID from JWT

        // Also check query parameter as fallback
        const queryUserId = event.queryStringParameters?.userId;

        // Use authenticated user ID if available, otherwise use query parameter
        const finalUserId = userId || queryUserId;

        if (!finalUserId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'User ID is required. Please authenticate or provide userId in query parameters.'
                })
            };
        }

        console.log('Fetching bookings for user:', finalUserId);

        // Fetch bookings from Supabase using user_id
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('id, name, email, phone, tour, date, people, addons, total_price, created_at')
            .eq('user_id', finalUserId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching bookings:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Failed to fetch bookings',
                    error: error.message
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                bookings: bookings || []
            })
        };

    } catch (error) {
        console.error('Error fetching user bookings:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to fetch bookings',
                error: error.message
            })
        };
    }
};
