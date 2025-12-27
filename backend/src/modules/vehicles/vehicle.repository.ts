import { prisma } from "../../utils/prisma.js";
import type {
  CreateVehicleInput,
  UpdateVehicleDocsInput,
  UpdateVehicleStatusInput,
  UpdateVehicleInput,
  VehicleEntity
} from "./vehicle.types.js";

export class VehicleRepository {
  async create(data: CreateVehicleInput): Promise<VehicleEntity> {
    return prisma.vehicle.create({ data });
  }

  async findById(id: string): Promise<VehicleEntity | null> {
    return prisma.vehicle.findUnique({ where: { id } });
  }

  async findByFleet(fleetId: string): Promise<VehicleEntity[]> {
    return prisma.vehicle.findMany({ where: { fleetId } });
  }

  async findByHub(hubId: string): Promise<VehicleEntity[]> {
    return prisma.vehicle.findMany({ where: { hubId } });
  }

  async findByVehicleNumber(
    vehicleNumber: string
  ): Promise<VehicleEntity | null> {
    return prisma.vehicle.findUnique({ where: { vehicleNumber } });
  }

  async updateDocs(
    id: string,
    data: UpdateVehicleDocsInput
  ): Promise<VehicleEntity> {
    return prisma.vehicle.update({
      where: { id },
      data: {
        ...data,
        permitExpiry: data.permitExpiry
          ? new Date(data.permitExpiry)
          : undefined,
        fitnessExpiry: data.fitnessExpiry
          ? new Date(data.fitnessExpiry)
          : undefined,
        insuranceExpiry: data.insuranceExpiry
          ? new Date(data.insuranceExpiry)
          : undefined,
      },
    });
  }

  async updateStatus(
    id: string,
    data: UpdateVehicleStatusInput
  ): Promise<VehicleEntity> {
    return prisma.vehicle.update({ where: { id }, data });
  }

  async updateDetails(
    id: string,
    data: UpdateVehicleInput
  ): Promise<VehicleEntity> {
    return prisma.vehicle.update({ where: { id }, data });
  }
}