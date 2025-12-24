-- AlterEnum
ALTER TYPE "ProviderType" ADD VALUE 'MMT';

-- DropForeignKey
ALTER TABLE "RideProviderMapping" DROP CONSTRAINT "RideProviderMapping_rideId_fkey";

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "destinationCity" TEXT NOT NULL DEFAULT 'Unknown';

-- AddForeignKey
ALTER TABLE "RideProviderMapping" ADD CONSTRAINT "RideProviderMapping_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;
