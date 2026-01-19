import type { Driver, DriverStatus, KycStatus, DriverPreference, DriverPreferenceRequest, PreferenceDefination} from "@prisma/client";

export type CreateDriverInput = {
  userId: string;
  fleetId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  profilePic?: string;
  status?: DriverStatus;
  licenseFront?: string;
  licenseBack?: string;
  aadharFront?: string;
  aadharBack?: string;
  panCardImage?: string;
  livePhoto?: string;
  bankIdProof?: string;
  providerMetadata?: Record<string, unknown>;
  additionalDocuments?: string[];
};

export type CreateNewDriverInput = {
  userId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  dob: Date;
  address: string;
  city: string;
  pincode: number;

  aadharNumber: number;
  panNumber: string;
  drivingLicenceNumber: string;
  aadharFront: string;
  aadharBack: string;
  panPhoto: string;
  gstNumber?: string;

  haveVehicle: boolean;
  vehicleModel: string;
  vehicleType: string;
  registrationNumber: string;
  fuelType: string;
  ownerName: string;
  rcFrontImage: string;
  rcBackImage: string;

  referralCode?: string;
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

export type UpdateDriverInput = {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  profilePic?: string;
  licenseFront?: string;
  licenseBack?: string;
  aadharFront?: string;
  aadharBack?: string;
  panCardImage?: string;
  livePhoto?: string;
  bankIdProof?: string;
  providerMetadata?: Record<string, unknown>;
  additionalDocuments?: string[];
};

export type UpdateDriverStatusInput = {
  status: DriverStatus;
};


export type UpdateDriverAvailabilityInput = {
  isAvailable: boolean;
};

export type DriverEntity = Driver;
export type DriverPreferenceEntity = DriverPreference;
export type DriverPreferenceRequestEntity = DriverPreferenceRequest;
export type DriverPreferenceDefinationEnitity = PreferenceDefination;

export type UpdateDriverPreferenceInput = {
  requestedPreference: JSON;
}