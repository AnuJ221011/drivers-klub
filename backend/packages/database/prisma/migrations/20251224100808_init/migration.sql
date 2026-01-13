/*
  Warnings:

  - The `status` column on the `Ride` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Trip` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "HubManagerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHECKED_OUT');

-- AlterEnum
ALTER TYPE "ProviderType" ADD VALUE 'MMT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TripStatus" ADD VALUE 'BLOCKED';
ALTER TYPE "TripStatus" ADD VALUE 'NO_SHOW';
ALTER TYPE "TripStatus" ADD VALUE 'DRIVER_ASSIGNED';
ALTER TYPE "TripStatus" ADD VALUE 'CANCELLED_BY_PARTNER';

-- DropForeignKey
ALTER TABLE "RideProviderMapping" DROP CONSTRAINT "RideProviderMapping_rideId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_fleetId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_vehicleId_fkey";

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "hubId" TEXT,
ADD COLUMN     "licenseNumber" TEXT;

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "destinationCity" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "dropLat" DOUBLE PRECISION,
ADD COLUMN     "dropLng" DOUBLE PRECISION,
ADD COLUMN     "dropLocation" TEXT,
ADD COLUMN     "pickupLat" DOUBLE PRECISION,
ADD COLUMN     "pickupLng" DOUBLE PRECISION,
ADD COLUMN     "pickupLocation" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "billableKm" DROP NOT NULL,
ALTER COLUMN "ratePerKm" DROP NOT NULL,
ALTER COLUMN "totalFare" DROP NOT NULL,
ALTER COLUMN "vehicleSku" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TripStatus" NOT NULL DEFAULT 'CREATED';

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "hubId" TEXT;

-- DropTable
DROP TABLE "Trip";

-- CreateTable
CREATE TABLE "FleetHub" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "hubType" TEXT NOT NULL,
    "hubManagerId" TEXT,

    CONSTRAINT "FleetHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubManager" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "profilePicture" TEXT,
    "status" "HubManagerStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "hubId" TEXT,
    "fleetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "adminRemarks" TEXT,
    "checkInLat" DOUBLE PRECISION,
    "checkInLng" DOUBLE PRECISION,
    "selfieUrl" TEXT,
    "odometerStart" INTEGER,
    "odometerEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HubManager_fleetId_idx" ON "HubManager"("fleetId");

-- CreateIndex
CREATE INDEX "HubManager_mobile_idx" ON "HubManager"("mobile");

-- CreateIndex
CREATE INDEX "Attendance_driverId_idx" ON "Attendance"("driverId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX "Attendance_createdAt_idx" ON "Attendance"("createdAt");

-- AddForeignKey
ALTER TABLE "HubManager" ADD CONSTRAINT "HubManager_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideProviderMapping" ADD CONSTRAINT "RideProviderMapping_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
