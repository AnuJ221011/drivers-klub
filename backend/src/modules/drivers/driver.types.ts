import type { Driver, DriverStatus, KycStatus } from "@prisma/client";

export type CreateDriverInput = {
  userId: string;
  fleetId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  profilePic?: string;
};

/**
 * Lightweight shape for list views.
 * This intentionally avoids selecting KYC/doc fields so older DB schemas
 * (missing newly added columns) can still serve driver lists.
 */
export type DriverListItem = Pick<
  Driver,
  | "id"
  | "userId"
  | "fleetId"
  | "firstName"
  | "lastName"
  | "mobile"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

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
