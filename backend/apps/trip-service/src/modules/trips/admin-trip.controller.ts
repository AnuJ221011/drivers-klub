import { Request, Response } from "express";
import { TripAssignmentService } from "../../core/trip/services/trip-assignment.service.js";
import { ApiResponse, logger } from "@driversklub/common";

import { prisma } from "@driversklub/database";
import { mmtTracking } from "../partner/mmt/mmt.tracking.js";

export class AdminTripController {

    private getScope(req: Request): {
        id?: string;
        role?: string;
        fleetId: string | null;
        hubIds: string[];
    } {
        const u = req.user as any;
        return {
            id: u?.id,
            role: u?.role,
            fleetId: typeof u?.fleetId === "string" ? u.fleetId : u?.fleetId ?? null,
            hubIds: Array.isArray(u?.hubIds) ? u.hubIds : [],
        };
    }

    private assertScopeReady(scope: { role?: string; fleetId: string | null; hubIds: string[] }) {
        if (scope.role && scope.role !== "SUPER_ADMIN" && !scope.fleetId) {
            return { ok: false as const, status: 403, message: "Fleet scope not set for this user" };
        }
        if (scope.role === "OPERATIONS" && (!scope.hubIds || scope.hubIds.length === 0)) {
            return { ok: false as const, status: 403, message: "Hub scope not set for this user" };
        }
        return { ok: true as const };
    }

    private async assertDriverInScope(req: Request, driverId: string) {
        const scope = this.getScope(req);
        const ready = this.assertScopeReady(scope);
        if (!ready.ok) return ready;

        if (scope.role === "SUPER_ADMIN") return { ok: true as const };

        const driver = await prisma.driver.findFirst({
            where: { OR: [{ id: driverId }, { shortId: driverId }] },
            select: { id: true, fleetId: true, hubId: true },
        });
        if (!driver) return { ok: false as const, status: 404, message: "Driver not found" };

        if (driver.fleetId !== scope.fleetId) {
            return { ok: false as const, status: 403, message: "Access denied" };
        }
        if (scope.role === "OPERATIONS") {
            const hubId = driver.hubId || "";
            if (!scope.hubIds.includes(hubId)) {
                return { ok: false as const, status: 403, message: "Access denied" };
            }
        }
        return { ok: true as const };
    }

    async assignDriver(req: Request, res: Response) {
        const { tripId, driverId } = req.body;

        try {
            const scoped = await this.assertDriverInScope(req, driverId);
            if (!scoped.ok) {
                return res.status(scoped.status).json({ message: scoped.message });
            }

            const assignment = await TripAssignmentService.assignDriver(
                tripId,
                driverId
            );

            await this.pushDriverDetails(tripId, driverId);

            return ApiResponse.send(res, 201, { assignment }, "Driver assigned successfully");
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async unassignDriver(req: Request, res: Response) {
        const { tripId } = req.body;

        const scope = this.getScope(req);
        const ready = this.assertScopeReady(scope);
        if (!ready.ok) {
            return res.status(ready.status).json({ message: ready.message });
        }

        // If trip has an active assignment, ensure it belongs to the user's scope.
        if (scope.role !== "SUPER_ADMIN") {
            const activeAssignment = await prisma.tripAssignment.findFirst({
                where: { tripId, status: { in: ["ASSIGNED", "ACTIVE"] } },
                include: { driver: { select: { fleetId: true, hubId: true } } },
            });
            if (activeAssignment?.driver) {
                if (activeAssignment.driver.fleetId !== scope.fleetId) {
                    return res.status(403).json({ message: "Access denied" });
                }
                if (scope.role === "OPERATIONS") {
                    const hubId = activeAssignment.driver.hubId || "";
                    if (!scope.hubIds.includes(hubId)) {
                        return res.status(403).json({ message: "Access denied" });
                    }
                }
            }
        }

        await TripAssignmentService.unassignDriver(tripId);

        // NOTE: TripAssignmentService already reverts ride status to CREATED.
        // We should not cancel the trip here; unassign should keep it re-dispatchable.

        // MMT Hook (Detach driver)
        // DISABLED: MMT explicitly said not to use unassign events during testing
        // await this.pushDetachDetails(tripId);

        return ApiResponse.send(res, 200, null, "Driver unassigned successfully");
    }

    async reassignDriver(req: Request, res: Response) {
        const { tripId, driverId } = req.body;

        try {
            const scoped = await this.assertDriverInScope(req, driverId);
            if (!scoped.ok) {
                return res.status(scoped.status).json({ message: scoped.message });
            }

            // For reassign, we don't call unassign first for MMT trips
            // Reassign directly replaces the driver and sends MMT reassign event
            const assignment =
                await TripAssignmentService.reassignDriver(
                    tripId,
                    driverId
                );

            // Send MMT reassign event (not unassign + assign)
            await this.pushReassignDetails(tripId, driverId);

            return ApiResponse.send(res, 200, { assignment }, "Driver reassigned successfully");
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async detachDriver(req: Request, res: Response) {
        const { tripId, reason } = req.body;

        try {
            const scope = this.getScope(req);
            const ready = this.assertScopeReady(scope);
            if (!ready.ok) {
                return res.status(ready.status).json({ message: ready.message });
            }

            // For MMT trips, send detach event
            // This notifies MMT that driver is removed but keeps trip available for reassignment
            await this.pushDetachDetails(tripId, reason);

            return ApiResponse.send(res, 200, null, "Detach event sent to MMT successfully");
        } catch (error: any) {
            logger.error("[AdminTripController] detachDriver Error:", error);
            return res.status(400).json({ message: error.message });
        }
    }

    async getAllTrips(req: Request, res: Response) {

        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const { status, keyword } = req.query as { status?: string; keyword?: string };

            const scope = this.getScope(req);
            const ready = this.assertScopeReady(scope);
            if (!ready.ok) {
                return res.status(ready.status).json({ message: ready.message });
            }

            const where: any = {};
            if (status) {
                where.status = status;
            }

            if (keyword) {
                where.OR = [
                    { id: { contains: keyword, mode: 'insensitive' } },
                    { shortId: { contains: keyword, mode: 'insensitive' } },
                ];
            }

            // Non-super admins can only see trips that currently have an active assignment
            // to a driver within their scoped fleet (and hubs for OPERATIONS).
            if (scope.role && scope.role !== "SUPER_ADMIN") {
                where.tripAssignments = {
                    some: {
                        status: { in: ["ASSIGNED", "ACTIVE"] },
                        driver: {
                            fleetId: scope.fleetId,
                            ...(scope.role === "OPERATIONS" ? { hubId: { in: scope.hubIds } } : {}),
                        },
                    },
                };
            }

            const [trips, total] = await Promise.all([
                prisma.ride.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        tripAssignments: {
                            include: {
                                driver: true
                            }
                        },
                        providerMapping: true
                    }
                }),
                prisma.ride.count({ where })
            ]);

            return ApiResponse.send(res, 200, { trips, total, page, limit }, "Trips retrieved successfully");
        } catch (error: any) {
            logger.error("[AdminTripController] getAllTrips Error:", error);
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    private async pushDriverDetails(tripId: string, driverId: string) {
        try {
            const ride = await prisma.ride.findFirst({
                where: { OR: [{ id: tripId }, { shortId: tripId }] },
                select: { id: true }
            });
            if (!ride) return;

            const mapping = await prisma.rideProviderMapping.findUnique({ where: { rideId: ride.id } });
            if (mapping && mapping.providerType === "MMT") {
                const driver = await prisma.driver.findFirst({
                    where: { OR: [{ id: driverId }, { shortId: driverId }] },
                    select: { id: true, shortId: true, firstName: true, lastName: true, mobile: true, profilePic: true }
                });
                if (driver) {
                    await mmtTracking.assignChauffeur(mapping.externalBookingId, driver);
                }
            }
        } catch (e) {
            logger.error(`[AdminTripController] Failed to push MMT driver update for trip ${tripId}:`, e);
        }
    }

    private async pushReassignDetails(tripId: string, driverId: string) {
        try {
            const ride = await prisma.ride.findFirst({
                where: { OR: [{ id: tripId }, { shortId: tripId }] },
                select: { id: true }
            });
            if (!ride) return;

            const mapping = await prisma.rideProviderMapping.findUnique({ where: { rideId: ride.id } });
            if (mapping && mapping.providerType === "MMT") {
                const driver = await prisma.driver.findFirst({
                    where: { OR: [{ id: driverId }, { shortId: driverId }] },
                    select: { id: true, shortId: true, firstName: true, lastName: true, mobile: true, profilePic: true }
                });
                if (driver) {
                    await mmtTracking.reassignChauffeur(mapping.externalBookingId, driver);
                }
            }
        } catch (e) {
            logger.error(`[AdminTripController] Failed to push MMT reassign update for trip ${tripId}:`, e);
        }
    }

    private async pushDetachDetails(tripId: string, reason?: string) {
        try {
            const ride = await prisma.ride.findFirst({
                where: { OR: [{ id: tripId }, { shortId: tripId }] },
                select: { id: true }
            });
            if (!ride) return;

            const mapping = await prisma.rideProviderMapping.findUnique({ where: { rideId: ride.id } });
            if (mapping && mapping.providerType === "MMT") {
                await mmtTracking.detachBooking(mapping.externalBookingId, reason || "No available inventory");
            }
        } catch (e) {
            logger.error(`[AdminTripController] Failed to push MMT detach for trip ${tripId}:`, e);
        }
    }
}
