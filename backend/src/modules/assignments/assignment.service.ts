import { AssignmentRepository } from "./assignment.repository.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

export class AssignmentService {
  private repo = new AssignmentRepository();

  async createAssignment(data: any) {
    const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });

    if (!driver || !vehicle) {
      throw new ApiError(404, "Driver or Vehicle not found");
    }

    if (driver.fleetId !== vehicle.fleetId || driver.fleetId !== data.fleetId) {
      throw new ApiError(400, "Driver and Vehicle must belong to same fleet");
    }

    const activeDriver = await this.repo.findActiveByDriver(data.driverId);
    if (activeDriver) {
      throw new ApiError(409, "Driver already has an active assignment");
    }

    const activeVehicle = await this.repo.findActiveByVehicle(data.vehicleId);
    if (activeVehicle) {
      throw new ApiError(409, "Vehicle already has an active assignment");
    }

    return this.repo.create(data);
  }

  getAssignmentsByFleet(fleetId: string) {
    return this.repo.findByFleet(fleetId);
  }

  getAssignmentById(id: string) {
    return this.repo.findById(id);
  }

  endAssignment(id: string) {
    return this.repo.endAssignment(id);
  }
}
