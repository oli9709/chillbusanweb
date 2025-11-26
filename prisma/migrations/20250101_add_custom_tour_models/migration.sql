-- CreateEnum: CustomTourStatus
CREATE TYPE "custom_tour_status" AS ENUM ('pending', 'approved', 'rejected', 'paid', 'cancelled');

-- CreateEnum: PaymentStatus
CREATE TYPE "payment_status" AS ENUM ('succeeded', 'failed', 'refunded');

-- CreateTable: CustomTourRequest
CREATE TABLE "custom_tour_requests" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_tour_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CustomTourPayment
CREATE TABLE "custom_tour_payments" (
    "id" TEXT NOT NULL,
    "customTourId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amount" INTEGER NOT NULL,
    "paymentStatus" "payment_status" NOT NULL DEFAULT 'succeeded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_tour_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: CustomTourRequest userId
CREATE INDEX "custom_tour_requests_userId_idx" ON "custom_tour_requests"("userId");

-- CreateIndex: CustomTourRequest status
CREATE INDEX "custom_tour_requests_status_idx" ON "custom_tour_requests"("status");

-- CreateIndex: CustomTourRequest createdAt
CREATE INDEX "custom_tour_requests_createdAt_idx" ON "custom_tour_requests"("createdAt");

-- CreateIndex: CustomTourPayment customTourId
CREATE INDEX "custom_tour_payments_customTourId_idx" ON "custom_tour_payments"("customTourId");

-- CreateIndex: CustomTourPayment stripePaymentIntentId
CREATE INDEX "custom_tour_payments_stripePaymentIntentId_idx" ON "custom_tour_payments"("stripePaymentIntentId");

-- CreateIndex: CustomTourPayment paymentStatus
CREATE INDEX "custom_tour_payments_paymentStatus_idx" ON "custom_tour_payments"("paymentStatus");

-- AddForeignKey: CustomTourPayment -> CustomTourRequest
ALTER TABLE "custom_tour_payments" ADD CONSTRAINT "custom_tour_payments_customTourId_fkey" FOREIGN KEY ("customTourId") REFERENCES "custom_tour_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

