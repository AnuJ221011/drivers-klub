/*
  Warnings:

  - You are about to drop the column `maxReferrals` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `referralCode` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `referralCount` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `referredByDriverId` on the `Driver` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PreferencesRequestStatus" AS ENUM ('PENDING', 'REJECTED', 'APPROVED');

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_referredByDriverId_fkey";

-- DropIndex
DROP INDEX "Driver_referralCode_idx";

-- DropIndex
DROP INDEX "Driver_referralCode_key";

-- DropIndex
DROP INDEX "Driver_referredByDriverId_idx";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "maxReferrals",
DROP COLUMN "referralCode",
DROP COLUMN "referralCount",
DROP COLUMN "referredByDriverId";

-- CreateTable
CREATE TABLE "DriverPreference" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPreferenceRequest" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "currentPreference" JSONB NOT NULL,
    "requestedPreference" JSONB NOT NULL,
    "status" "PreferencesRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "DriverPreferenceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceDefination" (
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "defaultValue" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreferenceDefination_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverPreference_driverId_key" ON "DriverPreference"("driverId");

-- CreateIndex
CREATE INDEX "DriverPreference_driverId_idx" ON "DriverPreference"("driverId");

-- CreateIndex
CREATE INDEX "DriverPreferenceRequest_driverId_idx" ON "DriverPreferenceRequest"("driverId");

-- CreateIndex
CREATE INDEX "DriverPreferenceRequest_status_idx" ON "DriverPreferenceRequest"("status");

-- CreateIndex
CREATE INDEX "PreferenceDefination_category_idx" ON "PreferenceDefination"("category");

-- CreateIndex
CREATE INDEX "PreferenceDefination_isActive_idx" ON "PreferenceDefination"("isActive");

-- AddForeignKey
ALTER TABLE "DriverPreference" ADD CONSTRAINT "DriverPreference_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPreferenceRequest" ADD CONSTRAINT "DriverPreferenceRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
