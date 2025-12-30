import { AssignmentRepository, type TripAssignmentRow } from "./assignment.repository.js";
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

  /**
   * Trip-wise assignment view (driver + vehicle for a trip).
   * Data source:
   * - tripAssignment (trip -> driver)
   * - active fleet assignment (driver -> vehicle)
   */
  async getAssignmentsByTrip(tripId: string) {
    // If trip doesn't exist, return empty list (keeps API simple for UI)
    const trip = await prisma.ride.findUnique({ where: { id: tripId }, select: { id: true } });
    if (!trip) return [];

    const tripAssignments: TripAssignmentRow[] = await this.repo.findTripAssignments(tripId);
    const driverIds: string[] = [...new Set(tripAssignments.map((a) => a.driverId))];
    const fleetAssignments = await this.repo.findActiveFleetAssignmentsByDriverIds(driverIds);

    const vehicleByDriverId = new Map<string, string>();
    for (const fa of fleetAssignments) {
      vehicleByDriverId.set(fa.driverId, fa.vehicleId);
    }

    return tripAssignments.map((ta) => ({
      id: ta.id,
      tripId: ta.tripId,
      driverId: ta.driverId,
      vehicleId: vehicleByDriverId.get(ta.driverId) ?? null,
      status: ta.status,
      startTime: ta.assignedAt,
      endTime: ta.unassignedAt,
      createdAt: ta.createdAt,
      updatedAt: ta.updatedAt
    }));
  }

  async getAssignmentById(id: string) {
    const assignment = await this.repo.findById(id);
    if (!assignment) throw new ApiError(404, "Assignment not found");
    return assignment;
  }

  endAssignment(id: string) {
    return this.repo.endAssignment(id);
  }
}