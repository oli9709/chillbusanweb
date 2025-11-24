/**
 * Vercel API Route: Comments
 * Handles comment fetching and creation using Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim()
    .substring(0, 1000); // Limit length
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
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Supabase credentials missing'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle GET request - Fetch all comments
    if (req.method === 'GET') {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('id, name, text, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch comments'
        });
      }

      return res.status(200).json({
        success: true,
        comments: comments || []
      });
    }

    // Handle POST request - Add new comment
    if (req.method === 'POST') {
      const { name, text } = req.body;

      // Validate required fields
      if (!name || !text) {
        return res.status(400).json({ 
          success: false,
          error: 'Name and text are required' 
        });
      }

      // Sanitize inputs
      const sanitizedName = sanitizeInput(name);
      const sanitizedText = sanitizeInput(text);

      // Validate sanitized inputs
      if (!sanitizedName || !sanitizedText) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid input data' 
        });
      }

      // Insert comment into database
      const { data: newComment, error: insertError } = await supabase
        .from('comments')
        .insert({ name: sanitizedName, text: sanitizedText })
        .select('id, name, text, created_at')
        .single();

      if (insertError) {
        console.error('Error inserting comment:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create comment'
        });
      }

      return res.status(200).json({
        success: true,
        comment: newComment
      });
    }

    // Method not allowed
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}

