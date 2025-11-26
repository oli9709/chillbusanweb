-- Migration: Add Custom Tour System Models
-- Date: 2025-01-01
-- 
-- This migration creates tables for the custom tour booking system:
--   - custom_tour_requests: Stores custom tour booking requests
--   - custom_tour_payments: Tracks payment transactions for custom tours
--
-- Run this migration in your Supabase SQL editor or via Prisma migrate

-- CreateEnum: CustomTourStatus
DO $$ BEGIN
    CREATE TYPE "custom_tour_status" AS ENUM ('pending', 'approved', 'rejected', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: PaymentStatus
DO $$ BEGIN
    CREATE TYPE "payment_status" AS ENUM ('succeeded', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: CustomTourRequest
CREATE TABLE IF NOT EXISTS "custom_tour_requests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    "itinerary" JSONB NOT NULL,
    "travelers" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "addons" JSONB,
    "totalPrice" INTEGER NOT NULL,
    "status" "custom_tour_status" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_tour_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CustomTourPayment
CREATE TABLE IF NOT EXISTS "custom_tour_payments" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "customTourId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amount" INTEGER NOT NULL,
    "paymentStatus" "payment_status" NOT NULL DEFAULT 'succeeded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_tour_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: CustomTourRequest userId
CREATE INDEX IF NOT EXISTS "custom_tour_requests_userId_idx" ON "custom_tour_requests"("userId");

-- CreateIndex: CustomTourRequest status
CREATE INDEX IF NOT EXISTS "custom_tour_requests_status_idx" ON "custom_tour_requests"("status");

-- CreateIndex: CustomTourRequest createdAt
CREATE INDEX IF NOT EXISTS "custom_tour_requests_createdAt_idx" ON "custom_tour_requests"("createdAt");

-- CreateIndex: CustomTourPayment customTourId
CREATE INDEX IF NOT EXISTS "custom_tour_payments_customTourId_idx" ON "custom_tour_payments"("customTourId");

-- CreateIndex: CustomTourPayment stripePaymentIntentId
CREATE INDEX IF NOT EXISTS "custom_tour_payments_stripePaymentIntentId_idx" ON "custom_tour_payments"("stripePaymentIntentId");

-- CreateIndex: CustomTourPayment paymentStatus
CREATE INDEX IF NOT EXISTS "custom_tour_payments_paymentStatus_idx" ON "custom_tour_payments"("paymentStatus");

-- AddForeignKey: CustomTourPayment -> CustomTourRequest
-- Note: Using ON DELETE CASCADE so payments are deleted when tour request is deleted
DO $$ BEGIN
    ALTER TABLE "custom_tour_payments" 
    ADD CONSTRAINT "custom_tour_payments_customTourId_fkey" 
    FOREIGN KEY ("customTourId") 
    REFERENCES "custom_tour_requests"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comments for documentation
COMMENT ON TABLE "custom_tour_requests" IS 'Stores custom tour booking requests with itinerary, pricing, and status';
COMMENT ON TABLE "custom_tour_payments" IS 'Tracks payment transactions for custom tours via Stripe';
COMMENT ON COLUMN "custom_tour_requests"."itinerary" IS 'JSON array of chosen locations, activities, and times';
COMMENT ON COLUMN "custom_tour_requests"."addons" IS 'JSON array of add-ons (lunch, services, etc.)';
COMMENT ON COLUMN "custom_tour_requests"."basePrice" IS 'Base price in cents (or smallest currency unit)';
COMMENT ON COLUMN "custom_tour_requests"."totalPrice" IS 'Total price including add-ons in cents';
COMMENT ON COLUMN "custom_tour_payments"."amount" IS 'Payment amount in cents';
COMMENT ON COLUMN "custom_tour_payments"."stripePaymentIntentId" IS 'Stripe payment intent ID for tracking';

