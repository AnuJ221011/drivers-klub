import { prisma, vehicleSelect } from "@driversklub/database";
import type { VehicleRow } from "@driversklub/database";

export class VehicleRepository {
  async create(data: any): Promise<VehicleRow> {
    return prisma.vehicle.create({ data, select: vehicleSelect });
  }

  async updateDocs(id: string, data: any): Promise<VehicleRow> {
    return prisma.vehicle.update({
      where: { id },
      data,
      select: vehicleSelect,
    });
  }
}

