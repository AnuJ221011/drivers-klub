-- AlterTable
ALTER TABLE "User" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Fleet" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "RideProviderMapping" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "TripAssignment" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Break" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "RentalPlan" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "DriverRental" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "PaymentOrder" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "RentalPayment" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Incentive" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Penalty" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "VirtualQR" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "DailyCollection" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "FleetHub" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "HubManager" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "DriverPreference" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "DriverPreferenceRequest" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "PreferenceDefination" ADD COLUMN     "shortId" TEXT;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "shortId" TEXT;

-- CreateTable
CREATE TABLE "IdSequence" (
    "entity" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IdSequence_pkey" PRIMARY KEY ("entity","date")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_shortId_key" ON "User"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Fleet_shortId_key" ON "Fleet"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_shortId_key" ON "Vehicle"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_shortId_key" ON "Driver"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_shortId_key" ON "Assignment"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "RideProviderMapping_shortId_key" ON "RideProviderMapping"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Ride_shortId_key" ON "Ride"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "TripAssignment_shortId_key" ON "TripAssignment"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_shortId_key" ON "Attendance"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Break_shortId_key" ON "Break"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPlan_shortId_key" ON "RentalPlan"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverRental_shortId_key" ON "DriverRental"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_shortId_key" ON "PaymentOrder"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_shortId_key" ON "Transaction"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_shortId_key" ON "Payout"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPayment_shortId_key" ON "RentalPayment"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Incentive_shortId_key" ON "Incentive"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Penalty_shortId_key" ON "Penalty"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualQR_shortId_key" ON "VirtualQR"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCollection_shortId_key" ON "DailyCollection"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "FleetHub_shortId_key" ON "FleetHub"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "HubManager_shortId_key" ON "HubManager"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPreference_shortId_key" ON "DriverPreference"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPreferenceRequest_shortId_key" ON "DriverPreferenceRequest"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceDefination_shortId_key" ON "PreferenceDefination"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_shortId_key" ON "Referral"("shortId");

