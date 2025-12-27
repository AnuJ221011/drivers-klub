import { prisma } from "../../utils/prisma.js";
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
    return prisma.driver.findMany({ where: { fleetId } });
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
}