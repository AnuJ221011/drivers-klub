import { prisma, vehicleSelect } from "@driversklub/database";
import type {
  CreateVehicleInput,
  UpdateVehicleDocsInput,
  UpdateVehicleStatusInput,
  UpdateVehicleInput,
  VehicleEntity
} from "./vehicle.types.js";

export class VehicleRepository {
  async create(data: CreateVehicleInput): Promise<VehicleEntity> {
    return prisma.vehicle.create({ data, select: vehicleSelect });
  }

  async findById(id: string): Promise<VehicleEntity | null> {
    return prisma.vehicle.findUnique({ where: { id }, select: vehicleSelect });
  }

  async findByFleet(fleetId: string): Promise<VehicleEntity[]> {
    return prisma.vehicle.findMany({ where: { fleetId }, select: vehicleSelect });
  }

  async findByFleetAndHubs(fleetId: string, hubIds: string[]): Promise<VehicleEntity[]> {
    return prisma.vehicle.findMany({
      where: {
        fleetId,
        hubId: { in: hubIds },
      },
      select: vehicleSelect,
    });
  }

  async findByHub(hubId: string): Promise<VehicleEntity[]> {
    return prisma.vehicle.findMany({ where: { hubId }, select: vehicleSelect });
  }

  async findByVehicleNumber(
    vehicleNumber: string
  ): Promise<VehicleEntity | null> {
    return prisma.vehicle.findUnique({
      where: { vehicleNumber },
      select: vehicleSelect,
    });
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
      select: vehicleSelect,
    });
  }

  async updateStatus(
    id: string,
    data: UpdateVehicleStatusInput
  ): Promise<VehicleEntity> {
    return prisma.vehicle.update({ where: { id }, data, select: vehicleSelect });
  }

  async updateDetails(
    id: string,
    data: UpdateVehicleInput
  ): Promise<VehicleEntity> {
    return prisma.vehicle.update({ where: { id }, data, select: vehicleSelect });
  }
}