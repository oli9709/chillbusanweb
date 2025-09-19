const { neon } = require('@netlify/neon');

// Initialize Neon connection
const sql = neon();

// Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim()
    .substring(0, 1000); // Limit length
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  try {
    // Handle GET request - Fetch all comments
    if (event.httpMethod === 'GET') {
      const comments = await sql`
        SELECT id, name, text, created_at 
        FROM comments 
        ORDER BY created_at DESC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          comments: comments
        })
      };
    }

    // Handle POST request - Add new comment
    if (event.httpMethod === 'POST') {
      const { name, text } = JSON.parse(event.body);

      // Validate required fields
      if (!name || !text) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false,
            error: 'Name and text are required' 
          })
        };
      }

      // Sanitize inputs
      const sanitizedName = sanitizeInput(name);
      const sanitizedText = sanitizeInput(text);

      // Validate sanitized inputs
      if (!sanitizedName || !sanitizedText) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false,
            error: 'Invalid input data' 
          })
        };
      }

      // Insert comment into database
      const newComment = await sql`
        INSERT INTO comments (name, text) 
        VALUES (${sanitizedName}, ${sanitizedText}) 
        RETURNING id, name, text, created_at
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          comment: newComment[0]
        })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Method not allowed' 
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error' 
      })
    };
  }
};
