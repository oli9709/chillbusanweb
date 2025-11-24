/**
 * Vercel API Route: Stories
 * Handles story fetching and generation
 */

// Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim();
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Handle GET request - Return stories from static file
    if (req.method === 'GET') {
      // Redirect to the static JSON file
      return res.redirect(302, '/data/stories.json');
    }

    // Handle POST request - Generate new story JSON
    if (req.method === 'POST') {
      const { date, tour, caption, photos } = req.body;

      // Validate required fields
      if (!date || !tour || !caption || !photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'All fields are required, including at least one photo' 
        });
      }

      // Sanitize inputs
      const sanitizedDate = sanitizeInput(date);
      const sanitizedTour = sanitizeInput(tour);
      const sanitizedCaption = sanitizeInput(caption);
      const sanitizedPhotos = photos.map(photo => sanitizeInput(photo));

      // Validate sanitized inputs
      if (!sanitizedDate || !sanitizedTour || !sanitizedCaption || sanitizedPhotos.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid input data' 
        });
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
      return res.status(200).json({
        success: true,
        story: newStory
      });
    }

    // Method not allowed
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Error in stories function:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}

