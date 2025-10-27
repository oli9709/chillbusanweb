// Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim();
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
    // Handle GET request - Return stories from static file
    if (event.httpMethod === 'GET') {
      // Just redirect to the static JSON file
      return {
        statusCode: 302,
        headers: {
          ...headers,
          Location: '/data/stories.json'
        },
        body: ''
      };
    }

    // Handle POST request - Generate new story JSON
    if (event.httpMethod === 'POST') {
      const { date, tour, caption, photos } = JSON.parse(event.body);

      // Validate required fields
      if (!date || !tour || !caption || !photos || !Array.isArray(photos) || photos.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false,
            error: 'All fields are required, including at least one photo' 
          })
        };
      }

      // Sanitize inputs
      const sanitizedDate = sanitizeInput(date);
      const sanitizedTour = sanitizeInput(tour);
      const sanitizedCaption = sanitizeInput(caption);
      const sanitizedPhotos = photos.map(photo => sanitizeInput(photo));

      // Validate sanitized inputs
      if (!sanitizedDate || !sanitizedTour || !sanitizedCaption || sanitizedPhotos.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false,
            error: 'Invalid input data' 
          })
        };
      }

      // Create new story with next ID
      const newStory = {
        id: Date.now(), // Simple ID generation
        date: sanitizedDate,
        tour: sanitizedTour,
        caption: sanitizedCaption,
        photos: sanitizedPhotos
      };
      
      // Return the new story JSON
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          story: newStory
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
    console.error('Error in stories function:', error);
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

