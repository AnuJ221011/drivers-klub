import dotenv from "dotenv";
import path from "path";
import { DriverRepository } from "./driver.repository.js";
import { prisma } from "@driversklub/database";
import { ApiError } from "@driversklub/common";
import type {
  CreateDriverInput,
  CreateNewDriverInput,
  UpdateDriverAvailabilityInput,
  UpdateDriverInput,
  UpdateDriverStatusInput,
} from "./driver.types.js";
import { PreferencesRequestStatus, VehicleOwnership, Prisma } from "@prisma/client";
import { ReferralService } from "../referral/referral.service.js";
import { VehicleRepository } from "./vehicle.repository.js";

dotenv.config({ path: path.join(process.cwd(), "../../.env") });

export class DriverService {
  private driverRepo = new DriverRepository();
  private referralService = new ReferralService();
  private vehicleRepo = new VehicleRepository();

  private assertFleetScope(user: any, fleetId: string) {
    const role = String(user?.role || "");
    if (role === "SUPER_ADMIN") return;
    const scopedFleetId = user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (scopedFleetId !== fleetId) throw new ApiError(403, "Access denied");
  }

  private assertDriverScope(user: any, driver: { fleetId: string | null; hubId?: string | null }) {
    const role = String(user?.role || "");
    if (role === "SUPER_ADMIN") return;
    const scopedFleetId = user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (driver.fleetId !== scopedFleetId) throw new ApiError(403, "Access denied");
    if (role === "OPERATIONS") {
      const hubIds = Array.isArray(user?.hubIds) ? user.hubIds : [];
      if (!driver.hubId || !hubIds.includes(driver.hubId)) throw new ApiError(403, "Access denied");
    }
  }

  private async getDefaultFleetId() {
    const defaultFleetName = process.env.DEFAULT_FLEET_NAME;
    if(!defaultFleetName) {
      throw new ApiError(403, "Default Fleet not set");
    }

    const fleet = await prisma.fleet.findFirst({
      where: { name: process.env.DEFAULT_FLEET_NAME },
    });

    if (!fleet) {
      throw new ApiError(404, "Default Fleet not found");
    }

    return fleet.id;
  }

  async createDriver(data: CreateDriverInput, userScope?: any) {
    if (userScope) this.assertFleetScope(userScope, data.fleetId);
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== "DRIVER") {
      throw new ApiError(400, "User role must be DRIVER");
    }

    const existing = await this.driverRepo.findByUserId(data.userId);
    if (existing) {
      throw new ApiError(409, "Driver profile already exists for this user");
    }

    const fleet = await prisma.fleet.findUnique({
      where: { id: data.fleetId },
    });

    if (!fleet) {
      throw new ApiError(404, "Fleet not found");
    }

    const { additionalDocuments, providerMetadata, ...rest } = data;
    let meta: Prisma.InputJsonObject =
      providerMetadata && typeof providerMetadata === "object"
        ? { ...(providerMetadata as Prisma.InputJsonObject) }
        : {};
    if (Array.isArray(additionalDocuments) && additionalDocuments.length > 0) {
      meta = {
        ...meta,
        additionalDocuments: additionalDocuments as Prisma.InputJsonArray,
      };
    }
    const payload =
      Object.keys(meta).length > 0
        ? { ...rest, providerMetadata: meta }
        : rest;

    return this.driverRepo.create(payload);
  }

  async createNewDriver(data: CreateNewDriverInput) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== "DRIVER") {
      throw new ApiError(400, "User role must be DRIVER");
    }

    const existing = await this.driverRepo.findByUserId(data.userId);
    if (existing) {
      throw new ApiError(409, "Driver profile already exists for this user");
    }

    let referrerUser = null;
    if (data.referralCode) {
      referrerUser = await this.referralService.validateAndGetReferrer(
        data.referralCode
      );
    }

    const defaultFleetId = await this.getDefaultFleetId();

    // Create driver
    let driver = await this.driverRepo.createNewDriver(defaultFleetId, data);

    // Create vehicle if driver has one
    let vehicle = null;
    if (data.haveVehicle) {
      vehicle = await this.vehicleRepo.create({
        fleetId: defaultFleetId,
        vehicleNumber: data.registrationNumber,
        vehicleName: data.vehicleType,
        vehicleModel: data.vehicleModel,
        ownership: VehicleOwnership.OWNED,
        ownerName: data.ownerName,
        fuelType: data.fuelType,
        rcFrontImage: data.rcFrontImage,
        rcBackImage: data.rcBackImage,
      } as any);

      // Link vehicle to driver
      driver = await prisma.driver.update({
        where: { id: driver.id },
        data: { vehicleId: vehicle.id },
      });
    }

    // Create referral record if referral code was provided
    if (referrerUser) {
      await this.referralService.createReferralRecord(
        referrerUser.id,
        data.userId
      );
    }

    // Always update user's fleetId, and referredById if referrer exists
    await prisma.user.update({
      where: { id: data.userId },
      data: { 
        fleetId: defaultFleetId,
        ...(referrerUser && { referredById: referrerUser.id }),
      },
    });

    await this.referralService.ensureUserHasReferralCode(data.userId);

    return driver;
  }

  async getDriversByFleet(fleetId: string, userScope?: any) {
    if (userScope) this.assertFleetScope(userScope, fleetId);
    const role = String(userScope?.role || "");
    if (role === "OPERATIONS") {
      const hubIds = Array.isArray(userScope?.hubIds) ? userScope.hubIds : [];
      if (hubIds.length === 0) return [];
      return this.driverRepo.findAllByFleetAndHubs(fleetId, hubIds);
    }
    return this.driverRepo.findAllByFleet(fleetId);
  }

  async getDriversByHub(hubId: string, userScope?: any) {
    const role = String(userScope?.role || "");
    if (role === "OPERATIONS") {
      const hubIds = Array.isArray(userScope?.hubIds) ? userScope.hubIds : [];
      if (!hubIds.includes(hubId)) throw new ApiError(403, "Access denied");
    }
    const rows = await this.driverRepo.findAllByHub(hubId);
    if (userScope && role !== "SUPER_ADMIN") {
      for (const d of rows) this.assertDriverScope(userScope, d);
    }
    return rows;
  }

  async getDriverById(id: string, userScope?: any) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }
    if (userScope) this.assertDriverScope(userScope, driver);
    return driver;
  }

  async updateDriver(id: string, data: UpdateDriverInput, userScope?: any) {
    const driver = await this.getDriverById(id, userScope);

    const update: UpdateDriverInput = {};
    
    // Basic Info
    if (typeof data.firstName === "string") update.firstName = data.firstName;
    if (typeof data.lastName === "string") update.lastName = data.lastName;
    if (typeof data.mobile === "string") update.mobile = data.mobile;
    if (typeof data.email === "string") update.email = data.email;
    if (data.dob) update.dob = new Date(data.dob);
    if (typeof data.address === "string") update.address = data.address;
    if (typeof data.city === "string") update.city = data.city;
    if (typeof data.pincode === "string") update.pincode = data.pincode;
    if (typeof data.profilePic === "string") update.profilePic = data.profilePic;
    
    // KYC Value Fields
    if (typeof data.aadharNumber === "string") update.aadharNumber = data.aadharNumber;
    if (typeof data.panNumber === "string") update.panNumber = data.panNumber;
    if (typeof data.dlNumber === "string") update.dlNumber = data.dlNumber;
    if (typeof data.licenseNumber === "string") update.licenseNumber = data.licenseNumber;
    if (typeof data.gstNumber === "string") update.gstNumber = data.gstNumber;
    
    // Bank Details
    if (typeof data.bankAccountNumber === "string") update.bankAccountNumber = data.bankAccountNumber;
    if (typeof data.bankIfscCode === "string") update.bankIfscCode = data.bankIfscCode;
    if (typeof data.bankAccountName === "string") update.bankAccountName = data.bankAccountName;
    
    // KYC Attachment Fields
    if (typeof data.licenseFront === "string") update.licenseFront = data.licenseFront;
    if (typeof data.licenseBack === "string") update.licenseBack = data.licenseBack;
    if (typeof data.aadharFront === "string") update.aadharFront = data.aadharFront;
    if (typeof data.aadharBack === "string") update.aadharBack = data.aadharBack;
    if (typeof data.panCardImage === "string") update.panCardImage = data.panCardImage;
    if (typeof data.livePhoto === "string") update.livePhoto = data.livePhoto;
    if (typeof data.bankIdProof === "string") update.bankIdProof = data.bankIdProof;

    // Handle Vehicle Documents if driver has a vehicle
    if (driver.vehicleId) {
      const vehicleUpdate: any = {};
      
      // RC Images
      if (typeof data.rcFrontImage === "string") vehicleUpdate.rcFrontImage = data.rcFrontImage;
      if (typeof data.rcBackImage === "string") vehicleUpdate.rcBackImage = data.rcBackImage;
      
      // Fitness Documents
      if (typeof data.fitnessImage === "string") vehicleUpdate.fitnessImage = data.fitnessImage;
      if (data.fitnessExpiry) vehicleUpdate.fitnessExpiry = new Date(data.fitnessExpiry);
      
      // Insurance Documents
      if (typeof data.insuranceImage === "string") vehicleUpdate.insuranceImage = data.insuranceImage;
      if (data.insuranceStart) vehicleUpdate.insuranceStart = new Date(data.insuranceStart);
      if (data.insuranceExpiry) vehicleUpdate.insuranceExpiry = new Date(data.insuranceExpiry);
      
      // Vehicle Identification
      if (typeof data.chassisNumber === "string") vehicleUpdate.chassisNumber = data.chassisNumber;
      if (typeof data.vinNumber === "string") vehicleUpdate.vinNumber = data.vinNumber;
      
      if (Object.keys(vehicleUpdate).length > 0) {
        await this.vehicleRepo.updateDocs(driver.vehicleId, vehicleUpdate);
      }
    }

    let meta: Prisma.InputJsonObject =
      data.providerMetadata && typeof data.providerMetadata === "object"
        ? { ...(data.providerMetadata as Prisma.InputJsonObject) }
        : {};
    if (Array.isArray(data.additionalDocuments) && data.additionalDocuments.length > 0) {
      meta = {
        ...meta,
        additionalDocuments: data.additionalDocuments as Prisma.InputJsonArray,
      };
    }
    if (Object.keys(meta).length > 0) {
      update.providerMetadata = meta;
    }

    return this.driverRepo.updateDetails(id, update);
  }

  async updateDriverStatus(id: string, data: UpdateDriverStatusInput, userScope?: any) {
    await this.getDriverById(id, userScope);
    if (!data?.status) throw new ApiError(400, "status is required");
    return this.driverRepo.updateStatus(id, data);
  }

  async updateDriverAvailability(
    id: string,
    data: UpdateDriverAvailabilityInput,
    userScope?: any
  ) {
    await this.getDriverById(id, userScope);
    if (typeof data?.isAvailable !== "boolean") {
      throw new ApiError(400, "isAvailable must be boolean");
    }
    return this.driverRepo.updateAvailability(id, data);
  }

  async getDriverPreferences(id: string, userScope?: any) {
    await this.getDriverById(id, userScope);

    const driverPreference = await this.driverRepo.findDriverPreferences(id);
    const preferenceDefinations =
      await this.driverRepo.findDriverPreferenceDefination();

    const preferencesObj =
      driverPreference?.preferences &&
        typeof driverPreference.preferences === "object" &&
        !Array.isArray(driverPreference.preferences) &&
        driverPreference.preferences !== null
        ? (driverPreference.preferences as Record<string, any>)
        : {};

    const preferences = preferenceDefinations.map((def) => ({
      key: def.key,
      displayName: def.displayName,
      description: def.description,
      category: def.category,
      approvalRequired: def.approvalRequired,
      value: preferencesObj[def.key] ?? def.defaultValue ?? false,
    }));

    return preferences;
  }

  async driverPreferencesChangeRequest(id: string, data: any) {
    const driverPreferenceUpdateRequest =
      await prisma.driverPreferenceRequest.findFirst({
        where: { driverId: id, status: PreferencesRequestStatus.PENDING },
      });

    if (driverPreferenceUpdateRequest) {
      throw new ApiError(
        400,
        "Preferences Update Request already present in Pending state"
      );
    }

    const currentPreferencesArray = await this.getDriverPreferences(id);

    // Transform current preferences array to key-value JSON object
    const currentPreferences: Record<string, any> = {};
    currentPreferencesArray.forEach((pref) => {
      currentPreferences[pref.key] = pref.value;
    });

    // Frontend sends only key-value pairs, use it as requested preferences
    const requestedPreferences = data;

    return await this.driverRepo.createDriverPreferencesChangeRequest(
      id,
      currentPreferences,
      requestedPreferences
    );
  }

  async getPendingPreferenceChangeRequests(userScope?: any) {
    const role = String(userScope?.role || "");
    if (role === "SUPER_ADMIN") {
      return this.driverRepo.getPendingPreferenceChangeRequests();
    }
    const scopedFleetId = userScope?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (role === "OPERATIONS") {
      const hubIds = Array.isArray(userScope?.hubIds) ? userScope.hubIds : [];
      return this.driverRepo.getPendingPreferenceChangeRequestsScoped({ fleetId: scopedFleetId, hubIds });
    }
    return this.driverRepo.getPendingPreferenceChangeRequestsScoped({ fleetId: scopedFleetId });
  }

  async updatePendingPreferenceChangeRequest(data: any, reviewedBy?: string) {
    const { id, status, rejection_reason } = data;

    // Fetch the preference change request to get the requested preferences
    const preferenceRequest =
      await this.driverRepo.findPreferenceChangeRequestByIdAndStatus(
        id,
        PreferencesRequestStatus.PENDING
      );

    if (!preferenceRequest) {
      throw new ApiError(404, "Preference change request not found");
    }

    if (status === PreferencesRequestStatus.REJECTED) {
      return await this.driverRepo.updatePreferenceChangeRequest(
        id,
        status,
        reviewedBy,
        rejection_reason
      );
    }

    const approvedPreferenceRequest =
      await this.driverRepo.updatePreferenceChangeRequest(
        id,
        PreferencesRequestStatus.APPROVED,
        reviewedBy
      );

    const currentPreference = await this.getDriverPreferences(
      approvedPreferenceRequest.driverId
    );

    // Merge current preferences with requested preferences
    const currentPreferences: Record<string, any> = {};

    currentPreference.forEach((pref) => {
      currentPreferences[pref.key] = pref.value;
    });

    const requestedPreferences =
      approvedPreferenceRequest.requestedPreference &&
        typeof approvedPreferenceRequest.requestedPreference === "object" &&
        !Array.isArray(approvedPreferenceRequest.requestedPreference) &&
        approvedPreferenceRequest.requestedPreference !== null
        ? (approvedPreferenceRequest.requestedPreference as Record<string, any>)
        : {};

    const updatedPreference = {
      ...currentPreferences,
      ...requestedPreferences,
    };

    // Update driver preferences with merged preferences
    await prisma.driverPreference.upsert({
      where: { driverId: approvedPreferenceRequest.driverId },
      update: { preferences: updatedPreference },
      create: {
        driverId: approvedPreferenceRequest.driverId,
        preferences: updatedPreference,
      },
    });

    return approvedPreferenceRequest;
  }
}