import api from './axios';

import type { Driver, DriverEntity } from '../models/driver/driver';

function toUiDriver(entity: DriverEntity): Driver {
  return {
    id: entity.id,
    name: `${entity.firstName} ${entity.lastName}`.trim(),
    phone: entity.mobile,
    isActive: entity.status === 'ACTIVE',
    isAvailable: Boolean(entity.isAvailable),
    hubId: entity.hubId ?? null,
    createdAt: entity.createdAt,
  };
}

export async function getDriversByFleet(fleetId: string): Promise<Driver[]> {
  const res = await api.get<DriverEntity[]>(`/drivers/fleet/${fleetId}`);
  return (res.data || []).map(toUiDriver);
}

export type CreateDriverInput = {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  isActive: boolean;
  email?: string;
  dob?: string;
  address?: string;
  city?: string;
  pincode?: string;
  profilePic?: File | string | null;
  aadharNumber?: string;
  panNumber?: string;
  dlNumber?: string;
  licenseNumber?: string;
  gstNumber?: string;
  paymentModel?: 'RENTAL' | 'PAYOUT';
  depositBalance?: number | string;
  revSharePercentage?: number | string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountName?: string;
  licenseFront?: File | string | null;
  licenseBack?: File | string | null;
  aadharFront?: File | string | null;
  aadharBack?: File | string | null;
  panCardImage?: File | string | null;
  livePhoto?: File | string | null;
  bankIdProof?: File | string | null;
  providerMetadata?: Record<string, unknown> | null;
  additionalDocuments?: Array<File | string>;
  // Backwards compatible field names
  identityLivePhoto?: File | string | null;
  aadhaarCardFile?: File | string | null;
  panCardFile?: File | string | null;
  bankDetailsFile?: File | string | null;
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: 'NA' };
  if (parts.length === 1) return { firstName: parts[0], lastName: 'NA' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

type DriverDocValue = File | string | null | undefined;

function normalizeDriverDoc(value: DriverDocValue): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeDateInput(value: unknown): string | undefined {
  const normalized = normalizeOptionalString(value);
  if (!normalized) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T00:00:00.000Z`;
  }
  return normalized;
}

function normalizeOptionalNumber(value: number | string | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeDriverDocList(
  values: Array<File | string> | undefined,
): string[] | undefined {
  if (!values?.length) return undefined;
  const list = values
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  return list.length ? list : undefined;
}

/**
 * Creates:
 * 1) User (role=DRIVER)
 * 2) Driver profile for the selected fleet
 */
export async function createDriver(
  input: CreateDriverInput & { fleetId: string },
): Promise<Driver> {
  const trimmedFirstName = normalizeOptionalString(input.firstName);
  const trimmedLastName = normalizeOptionalString(input.lastName);
  const resolvedName = normalizeOptionalString(input.name);
  const fullName =
    resolvedName || [trimmedFirstName, trimmedLastName].filter(Boolean).join(' ').trim();
  const nameSource = trimmedFirstName ? fullName : resolvedName || '';
  const { firstName, lastName } = trimmedFirstName
    ? { firstName: trimmedFirstName, lastName: trimmedLastName || 'NA' }
    : splitName(nameSource);

  // Create a DRIVER user first (required by backend)
  const userRes = await api.post<{ id: string }>(
    '/users',
    {
      name: fullName,
      phone: input.phone,
      role: 'DRIVER',
    },
  );

  const userId = userRes.data?.id;
  const livePhoto = normalizeDriverDoc(input.livePhoto ?? input.identityLivePhoto);
  const aadharFront = normalizeDriverDoc(input.aadharFront ?? input.aadhaarCardFile);
  const aadharBack = normalizeDriverDoc(input.aadharBack);
  const licenseFront = normalizeDriverDoc(input.licenseFront);
  const licenseBack = normalizeDriverDoc(input.licenseBack);
  const panCardImage = normalizeDriverDoc(input.panCardImage ?? input.panCardFile);
  const bankIdProof = normalizeDriverDoc(input.bankIdProof ?? input.bankDetailsFile);
  const profilePic = normalizeDriverDoc(input.profilePic);
  const additionalDocuments = normalizeDriverDocList(input.additionalDocuments);

  const payload: Record<string, unknown> = {
    userId,
    fleetId: input.fleetId,
    firstName,
    lastName,
    mobile: input.phone,
    status: input.isActive ? 'ACTIVE' : 'INACTIVE',
  };
  const email = normalizeOptionalString(input.email);
  const dob = normalizeDateInput(input.dob);
  const address = normalizeOptionalString(input.address);
  const city = normalizeOptionalString(input.city);
  const pincode = normalizeOptionalString(input.pincode);
  const aadharNumber = normalizeOptionalString(input.aadharNumber);
  const panNumber = normalizeOptionalString(input.panNumber);
  const dlNumber = normalizeOptionalString(input.dlNumber);
  const licenseNumber = normalizeOptionalString(input.licenseNumber);
  const gstNumber = normalizeOptionalString(input.gstNumber);
  const paymentModel = normalizeOptionalString(input.paymentModel);
  const depositBalance = normalizeOptionalNumber(input.depositBalance);
  const revSharePercentage = normalizeOptionalNumber(input.revSharePercentage);
  const bankAccountNumber = normalizeOptionalString(input.bankAccountNumber);
  const bankIfscCode = normalizeOptionalString(input.bankIfscCode);
  const bankAccountName = normalizeOptionalString(input.bankAccountName);
  if (email) payload.email = email;
  if (dob) payload.dob = dob;
  if (address) payload.address = address;
  if (city) payload.city = city;
  if (pincode) payload.pincode = pincode;
  if (profilePic) payload.profilePic = profilePic;
  if (aadharNumber) payload.aadharNumber = aadharNumber;
  if (panNumber) payload.panNumber = panNumber;
  if (dlNumber) payload.dlNumber = dlNumber;
  if (licenseNumber) payload.licenseNumber = licenseNumber;
  if (gstNumber) payload.gstNumber = gstNumber;
  if (paymentModel) payload.paymentModel = paymentModel;
  if (depositBalance !== undefined) payload.depositBalance = depositBalance;
  if (revSharePercentage !== undefined) payload.revSharePercentage = revSharePercentage;
  if (bankAccountNumber) payload.bankAccountNumber = bankAccountNumber;
  if (bankIfscCode) payload.bankIfscCode = bankIfscCode;
  if (bankAccountName) payload.bankAccountName = bankAccountName;
  if (livePhoto) payload.livePhoto = livePhoto;
  if (aadharFront) payload.aadharFront = aadharFront;
  if (aadharBack) payload.aadharBack = aadharBack;
  if (licenseFront) payload.licenseFront = licenseFront;
  if (licenseBack) payload.licenseBack = licenseBack;
  if (panCardImage) payload.panCardImage = panCardImage;
  if (bankIdProof) payload.bankIdProof = bankIdProof;
  const providerMetadata =
    input.providerMetadata && typeof input.providerMetadata === 'object'
      ? { ...(input.providerMetadata as Record<string, unknown>) }
      : {};
  if (additionalDocuments) providerMetadata.additionalDocuments = additionalDocuments;
  if (Object.keys(providerMetadata).length > 0) {
    payload.providerMetadata = providerMetadata;
  }

  const res = await api.post<DriverEntity>('/drivers', payload);

  return toUiDriver(res.data);
}

export type UpdateDriverInput = {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  dob?: string;
  address?: string;
  city?: string;
  pincode?: string;
  profilePic?: File | string | null;
  aadharNumber?: string;
  panNumber?: string;
  dlNumber?: string;
  licenseNumber?: string;
  gstNumber?: string;
  paymentModel?: 'RENTAL' | 'PAYOUT';
  depositBalance?: number | string;
  revSharePercentage?: number | string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountName?: string;
  licenseFront?: File | string | null;
  licenseBack?: File | string | null;
  aadharFront?: File | string | null;
  aadharBack?: File | string | null;
  panCardImage?: File | string | null;
  livePhoto?: File | string | null;
  bankIdProof?: File | string | null;
  providerMetadata?: Record<string, unknown> | null;
  additionalDocuments?: Array<File | string>;
  // Backwards compatible field names
  identityLivePhoto?: File | string | null;
  aadhaarCardFile?: File | string | null;
  panCardFile?: File | string | null;
  bankDetailsFile?: File | string | null;
};

export async function updateDriverDetails(
  driverId: string,
  input: UpdateDriverInput,
): Promise<Driver> {
  const patch: Record<string, unknown> = {};
  const firstName = normalizeOptionalString(input.firstName);
  const lastName = normalizeOptionalString(input.lastName);
  if (firstName) patch.firstName = firstName;
  if (lastName) patch.lastName = lastName;

  const normalizedName = normalizeOptionalString(input.name);
  if (!firstName && !lastName && normalizedName) {
    const split = splitName(normalizedName);
    patch.firstName = split.firstName;
    patch.lastName = split.lastName;
  }

  const phone = normalizeOptionalString(input.phone);
  if (phone) patch.mobile = phone;

  const email = normalizeOptionalString(input.email);
  const dob = normalizeDateInput(input.dob);
  const address = normalizeOptionalString(input.address);
  const city = normalizeOptionalString(input.city);
  const pincode = normalizeOptionalString(input.pincode);
  const profilePic = normalizeDriverDoc(input.profilePic);
  const aadharNumber = normalizeOptionalString(input.aadharNumber);
  const panNumber = normalizeOptionalString(input.panNumber);
  const dlNumber = normalizeOptionalString(input.dlNumber);
  const licenseNumber = normalizeOptionalString(input.licenseNumber);
  const gstNumber = normalizeOptionalString(input.gstNumber);
  const paymentModel = normalizeOptionalString(input.paymentModel);
  const depositBalance = normalizeOptionalNumber(input.depositBalance);
  const revSharePercentage = normalizeOptionalNumber(input.revSharePercentage);
  const bankAccountNumber = normalizeOptionalString(input.bankAccountNumber);
  const bankIfscCode = normalizeOptionalString(input.bankIfscCode);
  const bankAccountName = normalizeOptionalString(input.bankAccountName);

  if (email) patch.email = email;
  if (dob) patch.dob = dob;
  if (address) patch.address = address;
  if (city) patch.city = city;
  if (pincode) patch.pincode = pincode;
  if (profilePic) patch.profilePic = profilePic;
  if (aadharNumber) patch.aadharNumber = aadharNumber;
  if (panNumber) patch.panNumber = panNumber;
  if (dlNumber) patch.dlNumber = dlNumber;
  if (licenseNumber) patch.licenseNumber = licenseNumber;
  if (gstNumber) patch.gstNumber = gstNumber;
  if (paymentModel) patch.paymentModel = paymentModel;
  if (depositBalance !== undefined) patch.depositBalance = depositBalance;
  if (revSharePercentage !== undefined) patch.revSharePercentage = revSharePercentage;
  if (bankAccountNumber) patch.bankAccountNumber = bankAccountNumber;
  if (bankIfscCode) patch.bankIfscCode = bankIfscCode;
  if (bankAccountName) patch.bankAccountName = bankAccountName;

  const livePhoto = normalizeDriverDoc(input.livePhoto ?? input.identityLivePhoto);
  const aadharFront = normalizeDriverDoc(input.aadharFront ?? input.aadhaarCardFile);
  const aadharBack = normalizeDriverDoc(input.aadharBack);
  const licenseFront = normalizeDriverDoc(input.licenseFront);
  const licenseBack = normalizeDriverDoc(input.licenseBack);
  const panCardImage = normalizeDriverDoc(input.panCardImage ?? input.panCardFile);
  const bankIdProof = normalizeDriverDoc(input.bankIdProof ?? input.bankDetailsFile);
  const additionalDocuments = normalizeDriverDocList(input.additionalDocuments);

  if (livePhoto) patch.livePhoto = livePhoto;
  if (aadharFront) patch.aadharFront = aadharFront;
  if (aadharBack) patch.aadharBack = aadharBack;
  if (licenseFront) patch.licenseFront = licenseFront;
  if (licenseBack) patch.licenseBack = licenseBack;
  if (panCardImage) patch.panCardImage = panCardImage;
  if (bankIdProof) patch.bankIdProof = bankIdProof;
  const providerMetadata =
    input.providerMetadata && typeof input.providerMetadata === 'object'
      ? { ...(input.providerMetadata as Record<string, unknown>) }
      : {};
  if (additionalDocuments) providerMetadata.additionalDocuments = additionalDocuments;
  if (Object.keys(providerMetadata).length > 0) {
    patch.providerMetadata = providerMetadata;
  }

  const res = await api.patch<DriverEntity>(`/drivers/${driverId}`, patch);
  return toUiDriver(res.data);
}

export async function updateDriverStatus(
  driverId: string,
  isActive: boolean,
): Promise<Driver> {
  const res = await api.patch<DriverEntity>(`/drivers/${driverId}/status`, {
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  });
  return toUiDriver(res.data);
}

export async function updateDriverAvailability(
  driverId: string,
  isAvailable: boolean,
): Promise<Driver> {
  const res = await api.patch<DriverEntity>(`/drivers/${driverId}/availability`, {
    isAvailable,
  });
  return toUiDriver(res.data);
}