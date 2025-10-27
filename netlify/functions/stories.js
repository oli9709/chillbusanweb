const fs = require('fs');
const path = require('path');

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
    const storiesFilePath = path.join(__dirname, '../../data/stories.json');
    
    // Handle GET request - Fetch all stories
    if (event.httpMethod === 'GET') {
      const stories = JSON.parse(fs.readFileSync(storiesFilePath, 'utf8'));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          stories: stories
        })
      };
    }

    // Handle POST request - Add new story
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

      // Load existing stories
      const stories = JSON.parse(fs.readFileSync(storiesFilePath, 'utf8'));
      
      // Find next ID
      const nextId = Math.max(...stories.map(s => s.id), 0) + 1;
      
      // Create new story
      const newStory = {
        id: nextId,
        date: sanitizedDate,
        tour: sanitizedTour,
        caption: sanitizedCaption,
        photos: sanitizedPhotos
      };
      
      // Add to beginning of array (newest first)
      stories.unshift(newStory);
      
      // Save back to file
      fs.writeFileSync(storiesFilePath, JSON.stringify(stories, null, 2));
      
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

