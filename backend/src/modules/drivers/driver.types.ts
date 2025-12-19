import type { Driver, DriverStatus, KycStatus } from "@prisma/client";

export type CreateDriverInput = {
  userId: string;
  fleetId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  profilePic?: string;
};

export type UpdateDriverKycInput = {
  licenseFront?: string;
  licenseBack?: string;
  aadharFront?: string;
  aadharBack?: string;
  panCardImage?: string;
  livePhoto?: string;
  bankIdProof?: string;
  kycStatus?: KycStatus;
};

export type UpdateDriverStatusInput = {
  status: DriverStatus;
};

export type DriverEntity = Driver;
