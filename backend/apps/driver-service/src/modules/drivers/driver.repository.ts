import { PreferencesRequestStatus } from "@prisma/client";
import { prisma } from "@driversklub/database";
import type {
  CreateDriverInput,
  UpdateDriverInput,
  UpdateDriverKycInput,
  UpdateDriverStatusInput,
  UpdateDriverAvailabilityInput,
  DriverEntity,
  DriverPreferenceEntity,
  DriverPreferenceRequestEntity,
  DriverPreferenceDefinationEnitity,
  CreateNewDriverInput,
} from "./driver.types.js";

export class DriverRepository {
  async create(data: CreateDriverInput & { shortId: string }): Promise<DriverEntity> {
    return prisma.driver.create({ data });
  }

  async createNewDriver(fleetId: string, shortId: string, data: CreateNewDriverInput): Promise<DriverEntity> {
    return prisma.driver.create({
      data: {
        shortId: shortId,
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        mobile: data.mobile,
        fleetId: fleetId,
        dob: new Date(data.dob),
        city: data.city,
        address: data.address,
        pincode: data.pincode,
        email: data.email,
        aadharNumber: data.aadharNumber,
        panNumber: data.panNumber,
        dlNumber: data.drivingLicenceNumber,
        licenseNumber: data.drivingLicenceNumber,
        aadharFront: data.aadharFront,
        aadharBack: data.aadharBack,
        panCardImage: data.panPhoto,
        gstNumber: data.gstNumber,
      } as any,
    });
  }

  async findByUserId(userId: string): Promise<DriverEntity | null> {
    return prisma.driver.findUnique({ where: { userId } });
  }

  async findById(id: string): Promise<DriverEntity | null> {
    return prisma.driver.findFirst({
      where: {
        OR: [{ id }, { shortId: id }],
      },
    });
  }

  async findAllByFleet(fleetId: string): Promise<DriverEntity[]> {
    return prisma.driver.findMany({ where: { fleetId } });
  }

  async findAllByFleetAndHubs(fleetId: string, hubIds: string[]): Promise<DriverEntity[]> {
    return prisma.driver.findMany({
      where: {
        fleetId,
        hubId: { in: hubIds },
      },
    });
  }

  async findAllByHub(hubId: string): Promise<DriverEntity[]> {
    return prisma.driver.findMany({ where: { hubId } });
  }

  async updateKyc(
    id: string,
    data: UpdateDriverKycInput
  ): Promise<DriverEntity> {
    return prisma.driver.update({ where: { id }, data });
  }

  async updateDetails(
    id: string,
    data: UpdateDriverInput
  ): Promise<DriverEntity> {
    return prisma.driver.update({ where: { id }, data });
  }

  async updateStatus(
    id: string,
    data: UpdateDriverStatusInput
  ): Promise<DriverEntity> {
    return prisma.driver.update({ where: { id }, data });
  }

  async updateAvailability(
    id: string,
    data: UpdateDriverAvailabilityInput
  ): Promise<DriverEntity> {
    return prisma.driver.update({ where: { id }, data });
  }

  async findDriverPreferences(
    id: string
  ): Promise<DriverPreferenceEntity | null> {
    return prisma.driverPreference.findFirst({ where: { driverId: id } });
  }

  async createDriverPreferencesChangeRequest(
    id: string,
    currentPreference: any,
    requestedPreference: any
  ): Promise<DriverPreferenceRequestEntity> {
    return prisma.driverPreferenceRequest.create({
      data: {
        driverId: id,
        currentPreference,
        requestedPreference,
      },
    });
  }

  async findDriverPreferenceDefination(): Promise<
    DriverPreferenceDefinationEnitity[]
  > {
    return prisma.preferenceDefination.findMany();
  }

  async getPendingPreferenceChangeRequests(): Promise<
    DriverPreferenceRequestEntity[]
  > {
    return prisma.driverPreferenceRequest.findMany({
      where: { status: PreferencesRequestStatus.PENDING },
    });
  }

  async getPendingPreferenceChangeRequestsScoped(params: {
    fleetId: string;
    hubIds?: string[];
  }): Promise<DriverPreferenceRequestEntity[]> {
    return prisma.driverPreferenceRequest.findMany({
      where: {
        status: PreferencesRequestStatus.PENDING,
        driver: {
          fleetId: params.fleetId,
          ...(params.hubIds?.length ? { hubId: { in: params.hubIds } } : {}),
        },
      },
    });
  }

  async findPreferenceChangeRequestByIdAndStatus(
    id: string,
    status: PreferencesRequestStatus
  ): Promise<DriverPreferenceRequestEntity | null> {
    return prisma.driverPreferenceRequest.findFirst({
      where: {
        AND: [ // Ensure status match
          { status },
          { OR: [{ id }, { shortId: id }] } // ID match
        ]
      },
    });
  }

  async updatePreferenceChangeRequest(
    id: string,
    status: PreferencesRequestStatus,
    reviewedBy?: string,
    rejectionReason?: string
  ): Promise<DriverPreferenceRequestEntity> {
    const data: {
      status: PreferencesRequestStatus;
      reviewedAt?: Date;
      reviewedBy?: string;
      rejectionReason?: string;
    } = {
      status,
      reviewedAt: new Date(),
    };

    if (reviewedBy !== undefined) {
      data.reviewedBy = reviewedBy;
    }

    if (rejectionReason !== undefined) {
      data.rejectionReason = rejectionReason;
    }

    return prisma.driverPreferenceRequest.update({
      where: { id },
      data,
    });
  }
}
