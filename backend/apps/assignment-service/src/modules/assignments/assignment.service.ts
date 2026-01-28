import { AssignmentRepository, type TripAssignmentRow } from "./assignment.repository.js";
import { prisma } from "@driversklub/database";
import { ApiError, IdUtils, EntityType } from "@driversklub/common";

export class AssignmentService {
    private repo = new AssignmentRepository();

    private assertFleetScope(user: any, fleetId: string) {
        const role = String(user?.role || "");
        if (role === "SUPER_ADMIN") return;
        const scopedFleetId = user?.fleetId;
        if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
        if (scopedFleetId !== fleetId) throw new ApiError(403, "Access denied");
    }

    private assertHubScope(user: any, hubId: string | null | undefined) {
        const role = String(user?.role || "");
        if (role !== "OPERATIONS") return;
        const hubIds = Array.isArray(user?.hubIds) ? user.hubIds : [];
        if (!hubId || !hubIds.includes(hubId)) throw new ApiError(403, "Access denied");
    }

    async createAssignment(data: any, userScope?: any) {
        if (userScope) this.assertFleetScope(userScope, data.fleetId);
        const driver = await prisma.driver.findFirst({
            where: {
                OR: [{ id: data.driverId }, { shortId: data.driverId }]
            }
        });
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                OR: [{ id: data.vehicleId }, { shortId: data.vehicleId }]
            }
        });

        if (!driver || !vehicle) {
            throw new ApiError(404, "Driver or Vehicle not found");
        }

        if (driver.fleetId !== vehicle.fleetId || driver.fleetId !== data.fleetId) {
            throw new ApiError(400, "Driver and Vehicle must belong to same fleet");
        }

        if (userScope) {
            // operations can only assign within their hubs
            this.assertHubScope(userScope, driver.hubId ?? null);
            this.assertHubScope(userScope, vehicle.hubId ?? null);
        }

        const activeDriver = await this.repo.findActiveByDriver(driver.id);
        if (activeDriver) {
            throw new ApiError(409, "Driver already has an active assignment");
        }

        const activeVehicle = await this.repo.findActiveByVehicle(vehicle.id);
        if (activeVehicle) {
            throw new ApiError(409, "Vehicle already has an active assignment");
        }

        const shortId = await IdUtils.generateShortId(prisma, EntityType.ASSIGNMENT as any);

        return this.repo.create({
            ...data,
            shortId,
            driverId: driver.id,
            vehicleId: vehicle.id
        });
    }

    getAssignmentsByFleet(fleetId: string, userScope?: any) {
        if (userScope) this.assertFleetScope(userScope, fleetId);
        const role = String(userScope?.role || "");
        if (role === "OPERATIONS") {
            const hubIds = Array.isArray(userScope?.hubIds) ? userScope.hubIds : [];
            if (hubIds.length === 0) return [];
            return this.repo.findByFleetAndHubs(fleetId, hubIds);
        }
        return this.repo.findByFleet(fleetId);
    }

    /**
     * Trip-wise assignment view (driver + vehicle for a trip).
     * Data source:
     * - tripAssignment (trip -> driver)
     * - active fleet assignment (driver -> vehicle)
     */
    async getAssignmentsByTrip(tripId: string, userScope?: any) {
        // If trip doesn't exist, return empty list (keeps API simple for UI)
        const trip = await prisma.ride.findFirst({
            where: {
                OR: [{ id: tripId }, { shortId: tripId }]
            },
            select: { id: true }
        });
        if (!trip) return [];

        const tripAssignments: TripAssignmentRow[] = await this.repo.findTripAssignments(trip.id);
        let driverIds: string[] = [...new Set(tripAssignments.map((a) => a.driverId))];

        // Scope filter driverIds for non-super roles
        const role = String(userScope?.role || "");
        if (userScope && role !== "SUPER_ADMIN") {
            const scopedFleetId = userScope?.fleetId;
            if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
            const hubIds = Array.isArray(userScope?.hubIds) ? userScope.hubIds : [];
            const scopedDrivers = await prisma.driver.findMany({
                where: {
                    id: { in: driverIds },
                    fleetId: scopedFleetId,
                    ...(role === "OPERATIONS" ? { hubId: { in: hubIds } } : {}),
                },
                select: { id: true },
            });
            const allowed = new Set(scopedDrivers.map((d) => d.id));
            driverIds = driverIds.filter((id) => allowed.has(id));
        }

        const fleetAssignments = await this.repo.findActiveFleetAssignmentsByDriverIds(driverIds);

        const vehicleByDriverId = new Map<string, string>();
        for (const fa of fleetAssignments) {
            vehicleByDriverId.set(fa.driverId, fa.vehicleId);
        }

        const allowedDriverIds = new Set(driverIds);
        return tripAssignments
            .filter((ta) => allowedDriverIds.has(ta.driverId))
            .map((ta) => ({
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

    async getAssignmentById(id: string, userScope?: any) {
        const row = await this.repo.findById(id);
        if (!row) throw new ApiError(404, "Assignment not found");
        if (userScope) {
            this.assertFleetScope(userScope, row.fleetId);
            this.assertHubScope(userScope, (row as any).driver?.hubId ?? null);
            this.assertHubScope(userScope, (row as any).vehicle?.hubId ?? null);
        }
        return row;
    }

    async endAssignment(id: string, userScope?: any) {
        const row = await this.getAssignmentById(id, userScope);
        return this.repo.endAssignment(row.id);
    }
}
