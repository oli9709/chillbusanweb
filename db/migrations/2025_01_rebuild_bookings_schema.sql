-- Migration: Rebuild Bookings Table Schema
-- Date: 2025-01-XX
-- Purpose: Create clean booking schema for new booking system

-- Create new bookings table with clean schema
CREATE TABLE IF NOT EXISTS bookings_new (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bookingId text UNIQUE NOT NULL,
    customerName text NOT NULL,
    customerEmail text NOT NULL,
    tourType text NOT NULL,
    tourDate date NOT NULL,
    price numeric(10, 2) NOT NULL,
    paymentStatus text NOT NULL DEFAULT 'pending' CHECK (paymentStatus IN ('pending', 'paid', 'failed')),
    createdAt timestamptz DEFAULT now(),
    updatedAt timestamptz DEFAULT now()
);

-- Create index on bookingId for fast lookups
CREATE INDEX IF NOT EXISTS idx_bookings_bookingId ON bookings_new(bookingId);

-- Create index on customerEmail for user queries
CREATE INDEX IF NOT EXISTS idx_bookings_customerEmail ON bookings_new(customerEmail);

-- Create index on paymentStatus for filtering
CREATE INDEX IF NOT EXISTS idx_bookings_paymentStatus ON bookings_new(paymentStatus);

-- Create index on tourDate for date-based queries
CREATE INDEX IF NOT EXISTS idx_bookings_tourDate ON bookings_new(tourDate);

-- Add comment to table
COMMENT ON TABLE bookings_new IS 'Clean booking schema for new booking system';
COMMENT ON COLUMN bookings_new.bookingId IS 'Unique booking identifier (e.g., CBT-1234567890-1234)';
COMMENT ON COLUMN bookings_new.paymentStatus IS 'Payment status: pending, paid, or failed';

