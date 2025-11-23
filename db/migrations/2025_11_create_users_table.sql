-- Migration: Create users table for authentication and discount tracking
-- Date: 2025-11-21
-- 
-- This table stores user authentication data and welcome discount metadata
-- Fields:
--   - id: UUID (matches Supabase auth.users.id)
--   - email: User's email address (unique)
--   - full_name: User's full name
--   - created_at: Account creation timestamp
--   - first_booking_discount: Boolean flag for 10% welcome discount (default: true)
--   - discount_expiry: Expiry date for the welcome discount (default: 60 days from signup)

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY,
    email text NOT NULL UNIQUE,
    full_name text,
    created_at timestamptz DEFAULT now(),
    first_booking_discount boolean DEFAULT true,
    discount_expiry timestamptz DEFAULT (now() + interval '60 days')
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on discount status for queries
CREATE INDEX IF NOT EXISTS idx_users_discount ON users(first_booking_discount) WHERE first_booking_discount = true;

-- Add comment to table
COMMENT ON TABLE users IS 'User accounts with authentication and welcome discount tracking';
COMMENT ON COLUMN users.first_booking_discount IS '10% welcome discount flag - automatically granted on signup, valid for 60 days';
COMMENT ON COLUMN users.discount_expiry IS 'Expiry date for the welcome discount (60 days from account creation)';

