import { prisma } from "../../utils/prisma.js";
import type {
  CreateFleetInput,
  UpdateFleetStatusInput,
  FleetEntity
} from "./fleet.types.js";

export class FleetRepository {
  async create(data: CreateFleetInput): Promise<FleetEntity> {
    return prisma.fleet.create({
      data: {
        ...data,
        dob: data.dob ? new Date(data.dob) : undefined
      }
    });
  }

  async findAll(): Promise<FleetEntity[]> {
    return prisma.fleet.findMany();
  }

  async findById(id: string): Promise<FleetEntity | null> {
    return prisma.fleet.findUnique({ where: { id } });
  }

  async findByMobile(mobile: string): Promise<FleetEntity | null> {
    return prisma.fleet.findUnique({ where: { mobile } });
  }

  async updateStatus(
    id: string,
    data: UpdateFleetStatusInput
  ): Promise<FleetEntity> {
    return prisma.fleet.update({
      where: { id },
      data
    });
  }
}
