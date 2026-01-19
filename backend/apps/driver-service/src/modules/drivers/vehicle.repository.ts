import { prisma } from "@driversklub/database";
import type { Vehicle } from "@prisma/client";

export class VehicleRepository {
  async create(data: any): Promise<Vehicle> {
    return prisma.vehicle.create({ data });
  }
}

