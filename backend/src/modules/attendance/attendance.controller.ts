
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { AttendanceStatus } from "@prisma/client";

export class AttendanceController {

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const attendance = await prisma.attendance.findUnique({
                where: { id },
                include: {
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
                }
            });

            if (!attendance) {
                return res.status(404).json({ message: "Attendance not found" });
            }

            return ApiResponse.send(res, 200, attendance, "Attendance retrieved");
        } catch (error: any) {
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    async checkIn(req: Request, res: Response) {
        try {
            const { driverId, lat, lng, odometer, selfieUrl } = req.body;

            // const userId = req.user?.id;

            if (!driverId) {
                return res.status(400).json({ message: "Driver ID is required" });
            }

            // Check if already checked in today/active
            const existing = await prisma.attendance.findFirst({
                where: {
                    driverId,
                    status: { in: [AttendanceStatus.PENDING, AttendanceStatus.APPROVED] },
                    checkOutTime: null
                }
            });

            if (existing) {
                return res.status(400).json({ message: "Driver already checked in", attendance: existing });
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
        } catch (error: any) {
            console.error("Check-in Error:", error);
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // Driver Check-Out
    async checkOut(req: Request, res: Response) {
        try {
            const { driverId, odometer } = req.body;

            const active = await prisma.attendance.findFirst({
                where: {
                    driverId,
                    status: { in: [AttendanceStatus.PENDING, AttendanceStatus.APPROVED] },
                    checkOutTime: null
                }
            });

            if (!active) {
                return res.status(404).json({ message: "No active check-in found" });
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
        } catch (error: any) {
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // Admin Approve
    async approve(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { adminId, remarks } = req.body; // In real app, adminId from req.user

            const updated = await prisma.attendance.update({
                where: { id },
                data: {
                    status: AttendanceStatus.APPROVED,
                    approvedBy: adminId,
                    adminRemarks: remarks
                }
            });

            return ApiResponse.send(res, 200, updated, "Attendance approved");
        } catch (error: any) {
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // Admin Reject
    async reject(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { adminId, remarks } = req.body;

            const updated = await prisma.attendance.update({
                where: { id },
                data: {
                    status: AttendanceStatus.REJECTED,
                    approvedBy: adminId, // or rejectedBy
                    adminRemarks: remarks || "Rejected",
                    checkOutTime: new Date() // Auto checkout on rejection?
                }
            });

            return ApiResponse.send(res, 200, updated, "Attendance rejected");
        } catch (error: any) {
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // Get History (for Driver or Admin)
    async getHistory(req: Request, res: Response) {
        try {
            const { driverId } = req.query;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const where: any = {};
            if (driverId) where.driverId = String(driverId);

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
                                    orderBy: { createdAt: "desc" }
                                }
                            }
                        }
                    }
                }),
                prisma.attendance.count({ where })
            ]);

            return ApiResponse.send(res, 200, { data, total, page, limit }, "History retrieved");
        } catch (error: any) {
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }
}
