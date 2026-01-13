-- CreateEnum
CREATE TYPE "PaymentModel" AS ENUM ('RENTAL', 'PAYOUT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'RENTAL', 'TRIP_PAYMENT', 'INCENTIVE', 'PENALTY', 'DAILY_COLLECTION', 'PAYOUT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('MONETARY', 'WARNING', 'SUSPENSION', 'BLACKLIST');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PG_CARD', 'PG_UPI', 'PG_NETBANKING', 'VIRTUAL_QR', 'CASH');

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankIfscCode" TEXT,
ADD COLUMN     "depositBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentModel" "PaymentModel",
ADD COLUMN     "revSharePercentage" DOUBLE PRECISION DEFAULT 70;

-- CreateTable
CREATE TABLE "RentalPlan" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rentalAmount" DOUBLE PRECISION NOT NULL,
    "depositAmount" DOUBLE PRECISION NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverRental" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "rentalPlanId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverRental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "easebuzzTxnId" TEXT,
    "easebuzzStatus" TEXT,
    "easebuzzPaymentId" TEXT,
    "tripId" TEXT,
    "incentiveId" TEXT,
    "penaltyId" TEXT,
    "collectionId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incentive" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "category" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incentive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalty" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" "PenaltyType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "category" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "deductedFromDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositDeductionAt" TIMESTAMP(3),
    "depositDeductionAmount" DOUBLE PRECISION,
    "suspensionStartDate" TIMESTAMP(3),
    "suspensionEndDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isWaived" BOOLEAN NOT NULL DEFAULT false,
    "waivedBy" TEXT,
    "waivedAt" TIMESTAMP(3),
    "waiverReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualQR" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "virtualAccountId" TEXT NOT NULL,
    "virtualAccountNumber" TEXT,
    "ifscCode" TEXT,
    "qrCodeUrl" TEXT,
    "qrCodeBase64" TEXT,
    "upiId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualQR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCollection" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "virtualQRId" TEXT,
    "date" DATE NOT NULL,
    "qrCollectionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashCollectionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCollection" DOUBLE PRECISION NOT NULL,
    "expectedRevenue" DOUBLE PRECISION,
    "variance" DOUBLE PRECISION,
    "revSharePercentage" DOUBLE PRECISION,
    "revShareAmount" DOUBLE PRECISION,
    "incentiveAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "penaltyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPayout" DOUBLE PRECISION,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledBy" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "reconciliationNotes" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "payoutTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentalPlan_fleetId_idx" ON "RentalPlan"("fleetId");

-- CreateIndex
CREATE INDEX "RentalPlan_isActive_idx" ON "RentalPlan"("isActive");

-- CreateIndex
CREATE INDEX "DriverRental_driverId_idx" ON "DriverRental"("driverId");

-- CreateIndex
CREATE INDEX "DriverRental_expiryDate_idx" ON "DriverRental"("expiryDate");

-- CreateIndex
CREATE INDEX "DriverRental_isActive_idx" ON "DriverRental"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_easebuzzTxnId_key" ON "Transaction"("easebuzzTxnId");

-- CreateIndex
CREATE INDEX "Transaction_driverId_idx" ON "Transaction"("driverId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_easebuzzTxnId_idx" ON "Transaction"("easebuzzTxnId");

-- CreateIndex
CREATE INDEX "Incentive_driverId_idx" ON "Incentive"("driverId");

-- CreateIndex
CREATE INDEX "Incentive_isPaid_idx" ON "Incentive"("isPaid");

-- CreateIndex
CREATE INDEX "Incentive_createdAt_idx" ON "Incentive"("createdAt");

-- CreateIndex
CREATE INDEX "Penalty_driverId_idx" ON "Penalty"("driverId");

-- CreateIndex
CREATE INDEX "Penalty_type_idx" ON "Penalty"("type");

-- CreateIndex
CREATE INDEX "Penalty_isPaid_idx" ON "Penalty"("isPaid");

-- CreateIndex
CREATE INDEX "Penalty_isActive_idx" ON "Penalty"("isActive");

-- CreateIndex
CREATE INDEX "Penalty_isWaived_idx" ON "Penalty"("isWaived");

-- CreateIndex
CREATE INDEX "Penalty_createdAt_idx" ON "Penalty"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualQR_vehicleId_key" ON "VirtualQR"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualQR_virtualAccountId_key" ON "VirtualQR"("virtualAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualQR_upiId_key" ON "VirtualQR"("upiId");

-- CreateIndex
CREATE INDEX "VirtualQR_vehicleId_idx" ON "VirtualQR"("vehicleId");

-- CreateIndex
CREATE INDEX "VirtualQR_virtualAccountId_idx" ON "VirtualQR"("virtualAccountId");

-- CreateIndex
CREATE INDEX "DailyCollection_driverId_idx" ON "DailyCollection"("driverId");

-- CreateIndex
CREATE INDEX "DailyCollection_vehicleId_idx" ON "DailyCollection"("vehicleId");

-- CreateIndex
CREATE INDEX "DailyCollection_date_idx" ON "DailyCollection"("date");

-- CreateIndex
CREATE INDEX "DailyCollection_isReconciled_idx" ON "DailyCollection"("isReconciled");

-- CreateIndex
CREATE INDEX "DailyCollection_isPaid_idx" ON "DailyCollection"("isPaid");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCollection_driverId_date_key" ON "DailyCollection"("driverId", "date");

-- CreateIndex
CREATE INDEX "Driver_paymentModel_idx" ON "Driver"("paymentModel");

-- AddForeignKey
ALTER TABLE "RentalPlan" ADD CONSTRAINT "RentalPlan_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRental" ADD CONSTRAINT "DriverRental_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRental" ADD CONSTRAINT "DriverRental_rentalPlanId_fkey" FOREIGN KEY ("rentalPlanId") REFERENCES "RentalPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incentive" ADD CONSTRAINT "Incentive_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualQR" ADD CONSTRAINT "VirtualQR_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCollection" ADD CONSTRAINT "DailyCollection_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCollection" ADD CONSTRAINT "DailyCollection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCollection" ADD CONSTRAINT "DailyCollection_virtualQRId_fkey" FOREIGN KEY ("virtualQRId") REFERENCES "VirtualQR"("id") ON DELETE SET NULL ON UPDATE CASCADE;
