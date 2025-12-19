import { prisma } from "../../utils/prisma.js";
import type {
  CreateFleetManagerInput,
  UpdateFleetManagerStatusInput,
  FleetManagerEntity
} from "./fleetManager.types.js";

export class FleetManagerRepository {
  async create(data: CreateFleetManagerInput): Promise<FleetManagerEntity> {
    return prisma.fleetManager.create({ data });
  }

  async findByFleet(fleetId: string): Promise<FleetManagerEntity[]> {
    return prisma.fleetManager.findMany({ where: { fleetId } });
  }

  async findById(id: string): Promise<FleetManagerEntity | null> {
    return prisma.fleetManager.findUnique({ where: { id } });
  }

  async findByMobile(mobile: string): Promise<FleetManagerEntity | null> {
    return prisma.fleetManager.findFirst({ where: { mobile } });
  }

  async updateStatus(
    id: string,
    data: UpdateFleetManagerStatusInput
  ): Promise<FleetManagerEntity> {
    return prisma.fleetManager.update({ where: { id }, data });
  }
}
