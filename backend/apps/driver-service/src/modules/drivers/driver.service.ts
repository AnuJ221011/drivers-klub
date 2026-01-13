import { DriverRepository } from "./driver.repository.js";
import { prisma } from "@driversklub/database";
import { ApiError } from "@driversklub/common";
import type {
  CreateDriverInput,
  UpdateDriverAvailabilityInput,
  UpdateDriverInput,
  UpdateDriverStatusInput,
} from "./driver.types.js";
import { PreferencesRequestStatus } from "@prisma/client";

export class DriverService {
  private driverRepo = new DriverRepository();

  async createDriver(data: CreateDriverInput) {
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

    return this.driverRepo.create(data);
  }

  async getDriversByFleet(fleetId: string) {
    return this.driverRepo.findAllByFleet(fleetId);
  }

  async getDriversByHub(hubId: string) {
    return this.driverRepo.findAllByHub(hubId);
  }

  async getDriverById(id: string) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }
    return driver;
  }

  async updateDriver(id: string, data: UpdateDriverInput) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) throw new ApiError(404, "Driver not found");

    const update: UpdateDriverInput = {};
    if (typeof data.firstName === "string") update.firstName = data.firstName;
    if (typeof data.lastName === "string") update.lastName = data.lastName;
    if (typeof data.mobile === "string") update.mobile = data.mobile;
    if (typeof data.profilePic === "string")
      update.profilePic = data.profilePic;

    return this.driverRepo.updateDetails(id, update);
  }

  async updateDriverStatus(id: string, data: UpdateDriverStatusInput) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) throw new ApiError(404, "Driver not found");
    if (!data?.status) throw new ApiError(400, "status is required");
    return this.driverRepo.updateStatus(id, data);
  }

  async updateDriverAvailability(
    id: string,
    data: UpdateDriverAvailabilityInput
  ) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) throw new ApiError(404, "Driver not found");
    if (typeof data?.isAvailable !== "boolean") {
      throw new ApiError(400, "isAvailable must be boolean");
    }
    return this.driverRepo.updateAvailability(id, data);
  }

  async getDriverPreferences(id: string) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) throw new ApiError(404, "Driver not found");

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

  async getPendingPreferenceChangeRequests() {
    const pendingPreferenceChangeRequests =
      await this.driverRepo.getPendingPreferenceChangeRequests();

    return pendingPreferenceChangeRequests;
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
