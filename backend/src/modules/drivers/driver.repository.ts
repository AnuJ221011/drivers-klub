import { prisma } from "../../utils/prisma.js";
import type {
  CreateDriverInput,
  UpdateDriverKycInput,
  UpdateDriverStatusInput,
  DriverEntity,
  DriverListItem
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

  async findAllByFleet(fleetId: string): Promise<DriverListItem[]> {
    // Select only the fields needed for list views.
    // This reduces payload size and avoids runtime failures if the DB schema
    // is behind the Prisma schema (missing KYC/doc columns).
    return prisma.driver.findMany({
      where: { fleetId },
      select: {
        id: true,
        userId: true,
        fleetId: true,
        firstName: true,
        lastName: true,
        mobile: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async updateKyc(
    id: string,
    data: UpdateDriverKycInput
  ): Promise<DriverEntity> {
    return prisma.driver.update({ where: { id }, data });
  }

  async updateStatus(
    id: string,
    data: UpdateDriverStatusInput
  ): Promise<DriverEntity> {
    return prisma.driver.update({ where: { id }, data });
  }
}
