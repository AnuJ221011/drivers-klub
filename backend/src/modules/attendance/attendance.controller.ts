
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { AttendanceStatus, UserRole } from "@prisma/client";
import { ApiError } from "../../utils/apiError.js";

export class AttendanceController {

    /**
     * Admin list endpoint (Dashboard)
     * GET /attendance?status=PENDING&page=1&limit=10&driverId=...&fleetId=...
     */
    async list(req: Request, res: Response) {
        const status = (req.query.status as AttendanceStatus | undefined) ?? AttendanceStatus.PENDING;
        const driverId = req.query.driverId ? String(req.query.driverId) : undefined;
        const fleetId = req.query.fleetId ? String(req.query.fleetId) : undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = { status };
        if (driverId) where.driverId = driverId;
        if (fleetId) where.driver = { fleetId };

        const [data, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    driver: {
                        include: {
                            user: true,
                            fleet: true
                        }
                    }
                }
            }),
            prisma.attendance.count({ where })
        ]);

        return ApiResponse.send(res, 200, { data, total, page, limit }, "Attendance retrieved");
    }

    // Driver Check-In
    async checkIn(req: Request, res: Response) {
        const { driverId: driverIdFromBody, lat, lng, odometer, selfieUrl } = req.body;

        // Prefer JWT identity (Driver user) over passing IDs from client.
        let driverId: string | undefined = driverIdFromBody ? String(driverIdFromBody) : undefined;
        if (!driverId) {
            const userId = req.user?.id;
            if (!userId) throw new ApiError(401, "Unauthorized");

            const driver = await prisma.driver.findUnique({ where: { userId } });
            if (!driver) throw new ApiError(404, "Driver profile not found for this user");
            driverId = driver.id;
        }

        // Check if already checked in / active
        const existing = await prisma.attendance.findFirst({
            where: {
                driverId,
                status: { in: [AttendanceStatus.PENDING, AttendanceStatus.APPROVED] },
                checkOutTime: null
            }
        });

        if (existing) {
            throw new ApiError(400, "Driver already checked in");
        }

        const attendance = await prisma.attendance.create({
            data: {
                driverId,
                checkInLat: lat,
                checkInLng: lng,
                odometerStart: odometer,
                selfieUrl,
                status: AttendanceStatus.PENDING
            }
        });

        return ApiResponse.send(res, 201, attendance, "Check-in successful");
    }

    // Driver Check-Out
    async checkOut(req: Request, res: Response) {
        const { driverId: driverIdFromBody, odometer } = req.body;

        let driverId: string | undefined = driverIdFromBody ? String(driverIdFromBody) : undefined;
        if (!driverId) {
            const userId = req.user?.id;
            if (!userId) throw new ApiError(401, "Unauthorized");
            const driver = await prisma.driver.findUnique({ where: { userId } });
            if (!driver) throw new ApiError(404, "Driver profile not found for this user");
            driverId = driver.id;
        }

        const active = await prisma.attendance.findFirst({
            where: {
                driverId,
                status: { in: [AttendanceStatus.PENDING, AttendanceStatus.APPROVED] },
                checkOutTime: null
            }
        });

        if (!active) {
            throw new ApiError(404, "No active check-in found");
        }

        const updated = await prisma.attendance.update({
            where: { id: active.id },
            data: {
                checkOutTime: new Date(),
                status: AttendanceStatus.CHECKED_OUT,
                odometerEnd: odometer
            }
        });

        return ApiResponse.send(res, 200, updated, "Check-out successful");
    }

    // Admin Approve
    async approve(req: Request, res: Response) {
        const { id } = req.params;
        const { remarks } = req.body;
        const adminId = req.user?.id;
        if (!adminId) throw new ApiError(401, "Unauthorized");

        const updated = await prisma.attendance.update({
            where: { id },
            data: {
                status: AttendanceStatus.APPROVED,
                approvedBy: adminId,
                adminRemarks: remarks
            }
        });

        return ApiResponse.send(res, 200, updated, "Attendance approved");
    }

    // Admin Reject
    async reject(req: Request, res: Response) {
        const { id } = req.params;
        const { remarks } = req.body;
        const adminId = req.user?.id;
        if (!adminId) throw new ApiError(401, "Unauthorized");

        const updated = await prisma.attendance.update({
            where: { id },
            data: {
                status: AttendanceStatus.REJECTED,
                approvedBy: adminId, // or rejectedBy
                adminRemarks: remarks || "Rejected",
                checkOutTime: new Date() // Auto checkout on rejection
            }
        });

        return ApiResponse.send(res, 200, updated, "Attendance rejected");
    }

    // Get History (for Driver or Admin)
    async getHistory(req: Request, res: Response) {
        const { driverId } = req.query;
        const fleetId = req.query.fleetId ? String(req.query.fleetId) : undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (driverId) where.driverId = String(driverId);
        if (fleetId) where.driver = { fleetId };

        // If a driver is calling this endpoint, they should only see their own history.
        if (req.user?.role === UserRole.DRIVER) {
            const me = await prisma.driver.findUnique({ where: { userId: req.user.id } });
            if (!me) throw new ApiError(404, "Driver profile not found for this user");
            where.driverId = me.id;
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
                            user: true,
                            fleet: true
                        }
                    }
                }
            }),
            prisma.attendance.count({ where })
        ]);

        return ApiResponse.send(res, 200, { data, total, page, limit }, "History retrieved");
    }
}
