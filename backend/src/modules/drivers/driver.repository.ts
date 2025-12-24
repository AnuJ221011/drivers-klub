import { prisma } from "../../utils/prisma.js";
import { Prisma } from "@prisma/client";
import type {
  CreateDriverInput,
  UpdateDriverInput,
  UpdateDriverKycInput,
  UpdateDriverStatusInput,
  UpdateDriverAvailabilityInput,
  DriverEntity
} from "./driver.types.js";

export class DriverRepository {
  async create(data: CreateDriverInput): Promise<DriverEntity> {
    return prisma.driver.create({ data });
  }

  async findByUserId(userId: string): Promise<DriverEntity | null> {
    return prisma.driver.findUnique({ where: { userId } });
  }

  async findById(id: string): Promise<DriverEntity | null> {
    return prisma.driver.findUnique({ where: { id } });
  }

  async findAllByFleet(fleetId: string): Promise<DriverEntity[]> {
    try {
      return await prisma.driver.findMany({
        where: { fleetId },
        orderBy: { createdAt: "desc" }
      });
    } catch (err: unknown) {
      /**
       * In some deployments the DB can lag behind Prisma schema (missing columns).
       * Prisma will throw P2022 in this case. We retry with a "safe" select and
       * default missing fields so the API doesn't 500.
       */
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2022") {
        const drivers = await prisma.driver.findMany({
          where: { fleetId },
          orderBy: { createdAt: "desc" },
          // IMPORTANT: do NOT select fields that might not exist yet (e.g. isAvailable)
          select: {
            id: true,
            userId: true,
            fleetId: true,
            firstName: true,
            lastName: true,
            mobile: true,
            licenseNumber: true,
            profilePic: true,
            licenseFront: true,
            licenseBack: true,
            aadharFront: true,
            aadharBack: true,
            panCardImage: true,
            livePhoto: true,
            bankIdProof: true,
            kycStatus: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        });

        // Default isAvailable=true for older schemas.
        return drivers.map((d) => ({ ...d, isAvailable: true })) as unknown as DriverEntity[];
      }

      throw err;
    }
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
}