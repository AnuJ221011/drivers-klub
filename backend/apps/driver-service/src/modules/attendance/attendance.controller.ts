import { Request, Response } from "express";
import { prisma } from "@driversklub/database";
import { ApiResponse, logger, IdUtils, EntityType } from "@driversklub/common";
import { AttendanceStatus } from "@prisma/client";
import { checkGeoLocation } from "./attendance.service.js";
// import { RapidoService } from "../partner/rapido/rapido.service.js";


// const rapidoService = new RapidoService();

export class AttendanceController {

    async checkIn(req: Request, res: Response) {
        try {
            const { driverId, lat, lng, odometer, selfieUrl } = req.body;

            // const userId = req.user?.id;

            if (!driverId) {
                return res.status(400).json({ message: "Driver ID is required" });
            }

            const resolvedDriver = await prisma.driver.findFirst({
                where: { OR: [{ id: driverId }, { shortId: driverId }] },
                select: { id: true }
            });
            if (!resolvedDriver) return res.status(404).json({ message: "Driver not found" });

            // Check if already checked in today/active
            const existing = await prisma.attendance.findFirst({
                where: {
                    driverId: resolvedDriver.id,
                    status: { in: [AttendanceStatus.PENDING, AttendanceStatus.APPROVED] },
                    checkOutTime: null,
                },
            });

            if (existing) {
                return res
                    .status(400)
                    .json({ message: "Driver already checked in", attendance: existing });
            }

            // Check if driver is within radius of assigned hub location
            const isInGeoLocation = await checkGeoLocation(resolvedDriver.id, lat, lng);

            if (!isInGeoLocation) {
                return res.status(400).json({
                    message: "Driver is not nearby to assigned hub, move to assigned hub",
                });
            }

            const shortId = await IdUtils.generateShortId(prisma, EntityType.ATTENDANCE);

            const attendance = await prisma.attendance.create({
                data: {
                    shortId,
                    driverId: resolvedDriver.id,
                    checkInLat: lat,
                    checkInLng: lng,
                    odometerStart: odometer,
                    selfieUrl,
                    status: AttendanceStatus.PENDING,
                },
            });

            // Sync Rapido Status (Should go ONLINE if eligible)
            /*
            rapidoService.validateAndSyncRapidoStatus(driverId, "CHECK_IN").catch((error) => {
              logger.error(`[AttendanceController] Failed to sync Rapido status on check-in for driver ${driverId}:`, error);
            });
            */

            return ApiResponse.send(res, 201, attendance, "Check-in successful");
        } catch (error: any) {
            logger.error("[AttendanceController] Check-in Error:", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error", error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };

            const attendance = await prisma.attendance.findFirst({
                where: {
                    OR: [{ id }, { shortId: id }]
                },
                include: {
                    breaks: { orderBy: { startTime: "desc" } },
                    driver: {
                        include: {
                            fleet: true,
                            assignments: {
                                where: { status: "ACTIVE" },
                                include: { vehicle: true },
                                orderBy: { createdAt: "desc" }
                            }
                        }
                    }
                },
            });

            if (!attendance) {
                return res.status(404).json({ message: "Attendance not found" });
            }

            // Scope enforcement: drivers can only access their own attendance;
            // other non-super roles must stay within their fleet (and hub for operations).
            const role = String(req.user?.role || "");
            if (role === "DRIVER") {
                const userId = req.user?.id;
                if (!userId) return res.status(401).json({ message: "Unauthorized" });
                const driver = await prisma.driver.findUnique({
                    where: { userId },
                    select: { id: true },
                });
                if (!driver) return res.status(404).json({ message: "Driver not found" });
                if (attendance.driverId !== driver.id) {
                    return res.status(403).json({ message: "Access denied" });
                }
            } else if (role !== "SUPER_ADMIN") {
                const scopedFleetId = req.user?.fleetId || null;
                if (!scopedFleetId) return res.status(403).json({ message: "Fleet scope not set for this user" });
                const driverFleetId = attendance.driver?.fleetId;
                if (driverFleetId !== scopedFleetId) return res.status(403).json({ message: "Access denied" });
                if (role === "OPERATIONS") {
                    const hubIds = Array.isArray(req.user?.hubIds) ? req.user.hubIds : [];
                    const driverHubId = attendance.driver?.hubId || null;
                    if (!driverHubId || !hubIds.includes(driverHubId)) {
                        return res.status(403).json({ message: "Access denied" });
                    }
                }
            }

            return ApiResponse.send(res, 200, attendance, "Attendance retrieved");
        } catch (error: any) {
            return res
                .status(500)
                .json({ message: "Internal Server Error", error: error.message });
        }
    }


    // Driver Check-Out
    async checkOut(req: Request, res: Response) {
        try {
            const { driverId, odometer, cashDeposited, odometerImageUrl } = req.body;

            const resolvedDriver = await prisma.driver.findFirst({
                where: { OR: [{ id: driverId }, { shortId: driverId }] },
                select: { id: true }
            });
            if (!resolvedDriver) return res.status(404).json({ message: "Driver not found" });

            const active = await prisma.attendance.findFirst({
                where: {
                    driverId: resolvedDriver.id,
                    status: { in: [AttendanceStatus.PENDING, AttendanceStatus.APPROVED] },
                    checkOutTime: null,
                },
            });

            if (!active) {
                return res.status(404).json({ message: "No active check-in found" });
            }

            const endOdometer = Number(odometer);
            const cash = cashDeposited ? Number(cashDeposited) : 0;

            // Validate Odometer
            if (isNaN(endOdometer)) {
                return res.status(400).json({ message: "Invalid odometer reading" });
            }
            if (active.odometerStart && endOdometer < active.odometerStart) {
                return res.status(400).json({
                    message: `Odometer reading cannot be less than start reading (${active.odometerStart})`
                });
            }

            // Validate Cash
            if (isNaN(cash) || cash < 0) {
                return res.status(400).json({ message: "Invalid cash deposit amount" });
            }

            const updated = await prisma.attendance.update({
                where: { id: active.id },
                data: {
                    checkOutTime: new Date(),
                    status: AttendanceStatus.CHECKED_OUT,
                    odometerEnd: endOdometer,
                    odometerImageUrl,
                    cashDeposited: cash,
                },
            });

            // Sync Rapido Status (Should go OFFLINE)
            /*
            rapidoService.validateAndSyncRapidoStatus(driverId, "CHECK_OUT").catch((error) => {
              logger.error(`[AttendanceController] Failed to sync Rapido status on check-out for driver ${driverId}:`, error);
            });
            */

            return ApiResponse.send(res, 200, updated, "Check-out successful");
        } catch (error: any) {
            return res
                .status(500)
                .json({ message: "Internal Server Error", error: error.message });
        }
    }

    // Driver start break
    async startBreak(req: Request, res: Response) {
        try {
            const { driverId } = req.body;

            if (!driverId) {
                return res.status(400).json({ message: "Driver ID is required" });
            }

            const resolvedDriver = await prisma.driver.findFirst({
                where: { OR: [{ id: driverId }, { shortId: driverId }] },
                select: { id: true }
            });
            if (!resolvedDriver) return res.status(404).json({ message: "Driver not found" });

            const attendance = await prisma.attendance.findFirst({
                where: {
                    driverId: resolvedDriver.id,
                    status: { in: [AttendanceStatus.APPROVED] },
                    checkOutTime: null,
                },
                include: {
                    breaks: {
                        where: { endTime: null },
                    },
                },
            });

            if (!attendance) {
                return res
                    .status(404)
                    .json({ message: "No active approved attendance found for driver" });
            }

            // Check if break is already in progress
            if (attendance.breaks.length > 0) {
                return res
                    .status(400)
                    .json({ message: "Break is already in progress" });
            }

            const shortId = await IdUtils.generateShortId(prisma, EntityType.BREAK);

            // Create new break
            const newBreak = await prisma.break.create({
                data: {
                    shortId,
                    attendanceId: attendance.id,
                    startTime: new Date(),
                },
            });

            // Sync Rapido Status (Should go OFFLINE)
            /*
            rapidoService.validateAndSyncRapidoStatus(driverId, "START_BREAK").catch((error) => {
              logger.error(`[AttendanceController] Failed to sync Rapido status on start break for driver ${driverId}:`, error);
            });
            */

            return ApiResponse.send(res, 200, newBreak, "Break started successfully");
        } catch (error: any) {
            logger.error("[AttendanceController] Start break error:", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error", error: error.message });
        }
    }

    // Driver end break
    async endBreak(req: Request, res: Response) {
        try {
            const { driverId } = req.body;

            if (!driverId) {
                return res.status(400).json({ message: "Driver ID is required" });
            }

            const resolvedDriver = await prisma.driver.findFirst({
                where: { OR: [{ id: driverId }, { shortId: driverId }] },
                select: { id: true }
            });
            if (!resolvedDriver) return res.status(404).json({ message: "Driver not found" });

            const attendance = await prisma.attendance.findFirst({
                where: {
                    driverId: resolvedDriver.id,
                    status: { in: [AttendanceStatus.APPROVED] },
                    checkOutTime: null,
                },
                include: {
                    breaks: {
                        where: { endTime: null },
                        orderBy: { startTime: "desc" },
                        take: 1,
                    },
                },
            });

            if (!attendance || attendance.breaks.length === 0) {
                return res.status(404).json({ message: "No active break found" });
            }

            const activeBreak = attendance.breaks[0];

            const updatedBreak = await prisma.break.update({
                where: { id: activeBreak.id },
                data: { endTime: new Date() },
            });

            // Sync Rapido Status (Should go ONLINE if eligible)
            /*
            rapidoService.validateAndSyncRapidoStatus(driverId, "END_BREAK").catch((error) => {
              logger.error(`[AttendanceController] Failed to sync Rapido status on end break for driver ${driverId}:`, error);
            });
            */

            return ApiResponse.send(
                res,
                200,
                updatedBreak,
                "Break ended successfully"
            );
        } catch (error: any) {
            logger.error("[AttendanceController] End break error:", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error", error: error.message });
        }
    }

    // Admin Approve
    async approve(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const { adminId, remarks } = req.body; // In real app, adminId from req.user

            const attendance = await prisma.attendance.findFirst({
                where: { OR: [{ id }, { shortId: id }] },
                select: { id: true }
            });
            if (!attendance) return res.status(404).json({ message: "Attendance not found" });

            const updated = await prisma.attendance.update({
                where: { id: attendance.id },
                data: {
                    status: AttendanceStatus.APPROVED,
                    approvedBy: adminId,
                    adminRemarks: remarks,
                },
            });

            return ApiResponse.send(res, 200, updated, "Attendance approved");
        } catch (error: any) {
            return res
                .status(500)
                .json({ message: "Internal Server Error", error: error.message });
        }
    }

    // Admin Reject
    async reject(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const { adminId, remarks } = req.body;

            const attendance = await prisma.attendance.findFirst({
                where: { OR: [{ id }, { shortId: id }] },
                select: { id: true }
            });
            if (!attendance) return res.status(404).json({ message: "Attendance not found" });

            const updated = await prisma.attendance.update({
                where: { id: attendance.id },
                data: {
                    status: AttendanceStatus.REJECTED,
                    approvedBy: adminId, // or rejectedBy
                    adminRemarks: remarks || "Rejected",
                    checkOutTime: new Date(), // Auto checkout on rejection?
                },
            });

            return ApiResponse.send(res, 200, updated, "Attendance rejected");
        } catch (error: any) {
            return res
                .status(500)
                .json({ message: "Internal Server Error", error: error.message });
        }
    }

    // Get History (for Driver or Admin)
    async getHistory(req: Request, res: Response) {
        try {
            const { driverId } = req.query;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const role = String(req.user?.role || "");
            const where: any = {};
            if (role === "DRIVER") {
                const userId = req.user?.id;
                if (!userId) return res.status(401).json({ message: "Unauthorized" });
                const driver = await prisma.driver.findUnique({
                    where: { userId },
                    select: { id: true },
                });
                if (!driver) return res.status(404).json({ message: "Driver not found" });

                if (driverId) {
                    const resolvedDriver = await prisma.driver.findFirst({
                        where: { OR: [{ id: String(driverId) }, { shortId: String(driverId) }] },
                        select: { id: true }
                    });
                    if (!resolvedDriver || resolvedDriver.id !== driver.id) {
                        return res.status(403).json({ message: "Access denied" });
                    }
                }
                where.driverId = driver.id;
            } else {
                const scopedFleetId = req.user?.fleetId || null;
                const scopedHubIds = Array.isArray(req.user?.hubIds) ? req.user.hubIds : [];

                if (driverId) {
                    const resolved = await prisma.driver.findFirst({
                        where: { OR: [{ id: String(driverId) }, { shortId: String(driverId) }] },
                        select: { id: true }
                    });
                    if (resolved) where.driverId = resolved.id;
                    else where.driverId = String(driverId); // Fallback for no match
                }

                if (role !== "SUPER_ADMIN") {
                    if (!scopedFleetId) {
                        return res.status(403).json({ message: "Fleet scope not set for this user" });
                    }
                    where.driver = {
                        fleetId: scopedFleetId,
                        ...(role === "OPERATIONS" ? { hubId: { in: scopedHubIds } } : {}),
                    };
                }
            }

            const [data, total] = await Promise.all([
                prisma.attendance.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        driver: {
                            include: {
                                fleet: true,
                                assignments: {
                                    where: { status: "ACTIVE" },
                                    include: { vehicle: true },
                                    orderBy: { createdAt: "desc" },
                                },
                            },
                        },
                    },
                }),
                prisma.attendance.count({ where }),
            ]);

            return ApiResponse.send(
                res,
                200,
                { data, total, page, limit },
                "History retrieved"
            );
        } catch (error: any) {
            return res
                .status(500)
                .json({ message: "Internal Server Error", error: error.message });
        }
    }
}
