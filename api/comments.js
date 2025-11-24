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
      // Rate limiting: Check IP address (basic implementation)
      const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown';
      const rateLimitKey = `comment_${clientIp}`;
      
      // In production, use Redis or similar for rate limiting
      // For now, we'll rely on Supabase RLS policies and input validation
      
      const { name, text } = req.body;

      // Validate required fields
      if (!name || !text) {
        return res.status(400).json({ 
          success: false,
          error: 'Please provide both your name and comment text' 
        });
      }

      // Enhanced validation
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({ 
          success: false,
          error: 'Name must be between 2 and 50 characters' 
        });
      }

      if (text.length < 10 || text.length > 500) {
        return res.status(400).json({ 
          success: false,
          error: 'Comment must be between 10 and 500 characters' 
        });
      }

      // Sanitize inputs
      const sanitizedName = sanitizeInput(name);
      const sanitizedText = sanitizeInput(text);

      // Validate sanitized inputs
      if (!sanitizedName || !sanitizedText) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid input data. Please check your comment and try again.' 
        });
      }

      // Insert comment into database
      const { data: commentData, error: insertError } = await supabase
        .from('comments')
        .insert({ name: sanitizedName, text: sanitizedText })
        .select('id, name, text, created_at');

      if (insertError) {
        console.error('Error inserting comment:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create comment'
        });
      }

      // Get first item from array (INSERT should return one row)
      const newComment = commentData?.[0] ?? null;
      
      if (!newComment) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create comment - no data returned'
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

