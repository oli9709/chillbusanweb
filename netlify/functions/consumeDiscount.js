/**
 * Netlify Function: Consume Welcome Discount
 * Marks the first booking discount as used for a user
 */

const { createClient } = require('@supabase/supabase-js');

module.exports.handler = async (event) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Only allow POST
    if (event.httpMethod !== 'POST') {
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

        // Get authenticated user from Netlify context (preferred)
        const { user } = event.clientContext || {};
        let userId = user?.sub; // Supabase user ID from JWT

        // Fallback to request body if not in context
        if (!userId) {
            const body = JSON.parse(event.body || '{}');
            userId = body.userId;
        }

        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'User ID is required. Please authenticate or provide userId in request body.'
                })
            };
        }

        
        // Update users table to mark discount as used
        const { data, error } = await supabase
            .from('users')
            .update({ first_booking_discount: false })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating discount status:', error);
            throw error;
        }

        console.log(`Discount consumed for user: ${userId}`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Discount consumed successfully',
                data
            })
        };

    } catch (error) {
        console.error('Error consuming discount:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to consume discount',
                error: error.message
            })
        };
    }
};

