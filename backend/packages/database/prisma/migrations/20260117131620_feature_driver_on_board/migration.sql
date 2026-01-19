-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER', 'DRIVER');

-- CreateEnum
CREATE TYPE "FleetType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "FleetStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "HubManagerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VehicleOwnership" AS ENUM ('OWNED', 'LEASED');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'ENDED', 'ASSIGNED', 'UNASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('CREATED', 'STARTED', 'COMPLETED', 'CANCELLED', 'BLOCKED', 'NO_SHOW', 'DRIVER_ASSIGNED', 'CANCELLED_BY_PARTNER');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('INTERNAL', 'MOJOBOXX', 'MMT', 'RAPIDO');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('MOJOBOXX', 'MMT', 'RAPIDO');

-- CreateEnum
CREATE TYPE "ProviderBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProviderRideStatus" AS ENUM ('BOOKED', 'DRIVER_ASSIGNED', 'STARTED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('AIRPORT', 'RENTAL', 'INTER_CITY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "PaymentModel" AS ENUM ('RENTAL', 'PAYOUT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'RENTAL', 'TRIP_PAYMENT', 'INCENTIVE', 'PENALTY', 'DAILY_COLLECTION', 'PAYOUT', 'ORDER_PAYMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('MONETARY', 'WARNING', 'SUSPENSION', 'BLACKLIST');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PG_CARD', 'PG_UPI', 'PG_NETBANKING', 'VIRTUAL_QR', 'CASH', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PreferencesRequestStatus" AS ENUM ('PENDING', 'REJECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "fleetId" TEXT,
    "hubIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "referralCode" TEXT,
    "referredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fleet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "fleetType" "FleetType" NOT NULL,
    "gstNumber" TEXT,
    "panNumber" TEXT NOT NULL,
    "modeId" TEXT NOT NULL,
    "status" "FleetStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fleet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT,
    "hubId" TEXT,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehicleColor" TEXT,
    "ownership" "VehicleOwnership" NOT NULL,
    "ownerName" TEXT,
    "fuelType" "FuelType" NOT NULL,
    "rcFrontImage" TEXT,
    "rcBackImage" TEXT,
    "permitImage" TEXT,
    "permitExpiry" TIMESTAMP(3),
    "fitnessImage" TEXT,
    "fitnessExpiry" TIMESTAMP(3),
    "insuranceImage" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fleetId" TEXT,
    "hubId" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "profilePic" TEXT,
    "dob" TIMESTAMP(3),
    "vehicleId" TEXT,
    "email" TEXT,
    "address" TEXT,
    "pincode" TEXT,
    "city" TEXT,
    "aadharNumber" TEXT,
    "panNumber" TEXT,
    "dlNumber" TEXT,
    "gstNumber" TEXT,
    "licenseFront" TEXT,
    "licenseBack" TEXT,
    "aadharFront" TEXT,
    "aadharBack" TEXT,
    "panCardImage" TEXT,
    "livePhoto" TEXT,
    "bankIdProof" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "licenseNumber" TEXT,
    "paymentModel" "PaymentModel",
    "depositBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revSharePercentage" DOUBLE PRECISION DEFAULT 70,
    "bankAccountNumber" TEXT,
    "bankIfscCode" TEXT,
    "bankAccountName" TEXT,
    "providerMetadata" JSONB,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideProviderMapping" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "providerType" "ProviderType" NOT NULL,
    "externalBookingId" TEXT NOT NULL,
    "providerStatus" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideProviderMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL,
    "tripType" "TripType" NOT NULL,
    "originCity" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL DEFAULT 'Unknown',
    "tripDate" TIMESTAMP(3) NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "billableKm" INTEGER,
    "ratePerKm" INTEGER,
    "totalFare" DOUBLE PRECISION,
    "vehicleSku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" "Provider",
    "providerBookingId" TEXT,
    "providerStatus" "ProviderBookingStatus",
    "providerMeta" JSONB,
    "providerRideStatus" "ProviderRideStatus",
    "completedAt" TIMESTAMP(3),
    "dropLocation" TEXT,
    "pickupLocation" TEXT,
    "startedAt" TIMESTAMP(3),
    "status" "TripStatus" NOT NULL DEFAULT 'CREATED',
    "dropLat" DOUBLE PRECISION,
    "dropLng" DOUBLE PRECISION,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "pendingRescheduleTime" TIMESTAMP(3),

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripAssignment" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "bookingAttempted" BOOLEAN NOT NULL DEFAULT false,
    "bookingFailedReason" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripAssignment_pkey" PRIMARY KEY ("id")
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
    "odometerImageUrl" TEXT,
    "cashDeposited" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Break" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),

    CONSTRAINT "Break_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "description" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "collectedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "virtualAccountId" TEXT NOT NULL,
    "virtualAccountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "qrCodeBase64" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "driverId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "payoutId" TEXT,
    "rentalPaymentId" TEXT,
    "penaltyId" TEXT,
    "incentiveId" TEXT,
    "collectionId" TEXT,
    "paymentOrderId" TEXT,
    "easebuzzTxnId" TEXT,
    "easebuzzPaymentId" TEXT,
    "easebuzzStatus" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "description" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPayment" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "rentalPlanId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalPayment_pkey" PRIMARY KEY ("id")
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
    "defaultValue" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreferenceDefination_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referredById" TEXT NOT NULL,
    "referredToId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_fleetId_idx" ON "User"("fleetId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Otp_phone_idx" ON "Otp"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Fleet_mobile_key" ON "Fleet"("mobile");

-- CreateIndex
CREATE INDEX "Fleet_mobile_idx" ON "Fleet"("mobile");

-- CreateIndex
CREATE INDEX "Fleet_city_idx" ON "Fleet"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vehicleNumber_key" ON "Vehicle"("vehicleNumber");

-- CreateIndex
CREATE INDEX "Vehicle_fleetId_idx" ON "Vehicle"("fleetId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE INDEX "Driver_fleetId_idx" ON "Driver"("fleetId");

-- CreateIndex
CREATE INDEX "Driver_mobile_idx" ON "Driver"("mobile");

-- CreateIndex
CREATE INDEX "Driver_paymentModel_idx" ON "Driver"("paymentModel");

-- CreateIndex
CREATE INDEX "Assignment_fleetId_idx" ON "Assignment"("fleetId");

-- CreateIndex
CREATE INDEX "Assignment_driverId_idx" ON "Assignment"("driverId");

-- CreateIndex
CREATE INDEX "Assignment_vehicleId_idx" ON "Assignment"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "RideProviderMapping_rideId_key" ON "RideProviderMapping"("rideId");

-- CreateIndex
CREATE INDEX "Ride_status_idx" ON "Ride"("status");

-- CreateIndex
CREATE INDEX "Ride_tripDate_idx" ON "Ride"("tripDate");

-- CreateIndex
CREATE INDEX "Ride_originCity_idx" ON "Ride"("originCity");

-- CreateIndex
CREATE INDEX "TripAssignment_tripId_idx" ON "TripAssignment"("tripId");

-- CreateIndex
CREATE INDEX "TripAssignment_driverId_idx" ON "TripAssignment"("driverId");

-- CreateIndex
CREATE INDEX "TripAssignment_status_idx" ON "TripAssignment"("status");

-- CreateIndex
CREATE INDEX "Attendance_driverId_idx" ON "Attendance"("driverId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX "Attendance_createdAt_idx" ON "Attendance"("createdAt");

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
CREATE UNIQUE INDEX "PaymentOrder_virtualAccountId_key" ON "PaymentOrder"("virtualAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_easebuzzTxnId_key" ON "Transaction"("easebuzzTxnId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_easebuzzPaymentId_key" ON "Transaction"("easebuzzPaymentId");

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
CREATE INDEX "Transaction_paymentOrderId_idx" ON "Transaction"("paymentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_transactionId_key" ON "Payout"("transactionId");

-- CreateIndex
CREATE INDEX "Payout_driverId_idx" ON "Payout"("driverId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "RentalPayment_driverId_idx" ON "RentalPayment"("driverId");

-- CreateIndex
CREATE INDEX "RentalPayment_status_idx" ON "RentalPayment"("status");

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
CREATE INDEX "HubManager_fleetId_idx" ON "HubManager"("fleetId");

-- CreateIndex
CREATE INDEX "HubManager_mobile_idx" ON "HubManager"("mobile");

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

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredToId_key" ON "Referral"("referredToId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideProviderMapping" ADD CONSTRAINT "RideProviderMapping_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripAssignment" ADD CONSTRAINT "TripAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripAssignment" ADD CONSTRAINT "TripAssignment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Break" ADD CONSTRAINT "Break_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPlan" ADD CONSTRAINT "RentalPlan_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRental" ADD CONSTRAINT "DriverRental_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRental" ADD CONSTRAINT "DriverRental_rentalPlanId_fkey" FOREIGN KEY ("rentalPlanId") REFERENCES "RentalPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_rentalPaymentId_fkey" FOREIGN KEY ("rentalPaymentId") REFERENCES "RentalPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_penaltyId_fkey" FOREIGN KEY ("penaltyId") REFERENCES "Penalty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_incentiveId_fkey" FOREIGN KEY ("incentiveId") REFERENCES "Incentive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "DailyCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPayment" ADD CONSTRAINT "RentalPayment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPayment" ADD CONSTRAINT "RentalPayment_rentalPlanId_fkey" FOREIGN KEY ("rentalPlanId") REFERENCES "RentalPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "FleetHub" ADD CONSTRAINT "FleetHub_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubManager" ADD CONSTRAINT "HubManager_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPreference" ADD CONSTRAINT "DriverPreference_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPreferenceRequest" ADD CONSTRAINT "DriverPreferenceRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredToId_fkey" FOREIGN KEY ("referredToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
