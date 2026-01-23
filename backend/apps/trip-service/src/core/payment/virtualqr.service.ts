import { prisma, vehicleSelect } from "@driversklub/database";
import { easebuzzAdapter } from '../../adapters/easebuzz/easebuzz.adapter.js';
import { ApiError } from "@driversklub/common";
import { Prisma } from "@prisma/client";

export class VirtualQRService {
    /**
     * Generate virtual QR code for a vehicle
     * Production-hardened: Sanitization, Concurrency, Logging, Validation
     */
    async generateVehicleQR(vehicleId: string) {
        console.log(`[VirtualQR] Starting generation for vehicle: ${vehicleId}`);

        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: {
                ...vehicleSelect,
                fleet: {
                    select: { id: true, name: true, mobile: true },
                },
            },
        });

        if (!vehicle) {
            throw new ApiError(404, 'Vehicle not found');
        }

        // 1. Check if QR already exists (Early check)
        const existingQR = await prisma.virtualQR.findFirst({
            where: { vehicleId },
        });

        if (existingQR) {
            console.log(`[VirtualQR] Existing QR found for vehicle: ${vehicleId}`);
            return existingQR;
        }

        let fleetName: string;
        let customerMobile: string;
        let customerEmail: string;

        if (vehicle.fleet) {
            fleetName = vehicle.fleet.name;
            customerMobile = vehicle.fleet.mobile;
            customerEmail = vehicle.fleet.mobile + '@driversklub.com';
        } else {
            // Independent driver: Strict validation
            const driver = await prisma.driver.findFirst({
                where: { vehicleId: vehicle.id },
                include: { user: true }
            });

            if (!driver) {
                console.error(`[VirtualQR] Failed: Independent vehicle ${vehicleId} has no linked driver`);
                throw new ApiError(400, 'Independent vehicle must be linked to a driver for QR generation');
            }

            fleetName = driver.firstName + ' ' + driver.lastName;
            customerMobile = driver.mobile || driver.user.phone;
            customerEmail = driver.email || (customerMobile + '@driversklub.com');
        }

        // 2. Sanitation: Ensure vehicle number is alphanumeric for Easebuzz
        const sanitizedVehicleNumber = vehicle.vehicleNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        try {
            // 3. Create virtual account via Easebuzz
            // Note: If this succeeds but DB save fails, we might have an orphan at Easebuzz side.
            // Ideally, we store the "intent" first, but for now we log critically if DB save fails.
            const virtualAccount = await easebuzzAdapter.createVirtualAccount({
                vehicleNumber: sanitizedVehicleNumber,
                vehicleId: vehicle.id,
                fleetName: fleetName.substring(0, 50), // Truncate to safe length
                customerMobile: customerMobile,
                customerEmail: customerEmail,
            });

            // 4. Store in database with Concurrency Handling
            const virtualQR = await prisma.virtualQR.create({
                data: {
                    vehicleId: vehicle.id,
                    virtualAccountId: virtualAccount.virtualAccountId,
                    virtualAccountNumber: virtualAccount.virtualAccountNumber,
                    ifscCode: virtualAccount.ifscCode,
                    qrCodeBase64: virtualAccount.qrCodeBase64,
                    upiId: virtualAccount.upiId,
                    isActive: true,
                },
            });

            console.log(`[VirtualQR] Successfully created for vehicle: ${vehicleId}, VA: ${virtualAccount.virtualAccountId}`);
            return virtualQR;

        } catch (error: any) {
            // 5. Handle Race Condition: Unique constraint violation (P2002)
            // If another request created the QR in the meantime, return that one.
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                console.warn(`[VirtualQR] Race condition detected for vehicle: ${vehicleId}. Returning existing record.`);
                const raceQR = await prisma.virtualQR.findFirst({ where: { vehicleId } });
                if (raceQR) return raceQR;
            }

            console.error(`[VirtualQR] Creation failed for vehicle ${vehicleId}:`, error);

            // Re-throw appropriate error
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, `Failed to generate Virtual QR: ${error.message}`);
        }
    }

    /**
     * Get virtual QR for a vehicle
     * Adds fallback QR URL if qrCodeBase64 is empty
     */
    async getVehicleQR(vehicleId: string) {
        const qr = await prisma.virtualQR.findFirst({
            where: { vehicleId },
            include: { vehicle: { select: vehicleSelect } },
        });

        // Add fallback QR if qrCodeBase64 is empty
        if (qr && !qr.qrCodeBase64 && qr.upiId) {
            // Generate fallback QR URL
            const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(qr.upiId)}&pn=DriversKlub`;

            // Return with fallback QR
            return {
                ...qr,
                qrCodeBase64: fallbackQrUrl,
            };
        }

        return qr;
    }

    /**
     * Deactivate virtual QR
     */
    async deactivateVehicleQR(vehicleId: string) {
        return prisma.virtualQR.updateMany({
            where: { vehicleId },
            data: { isActive: false },
        });
    }

    /**
     * Reactivate virtual QR
     */
    async reactivateVehicleQR(vehicleId: string) {
        return prisma.virtualQR.updateMany({
            where: { vehicleId },
            data: { isActive: true },
        });
    }

    /**
     * Get QR code image (base64)
     */
    async getQRCodeImage(vehicleId: string) {
        const qr = await this.getVehicleQR(vehicleId);
        if (!qr) {
            throw new Error('Virtual QR not found for vehicle');
        }
        return qr.qrCodeBase64;
    }

    /**
     * Get virtual account transactions
     */
    async getVehicleTransactions(vehicleId: string, startDate?: string, endDate?: string) {
        const qr = await this.getVehicleQR(vehicleId);
        if (!qr) {
            throw new Error('Virtual QR not found for vehicle');
        }

        return easebuzzAdapter.getVirtualAccountTransactions(
            qr.virtualAccountId,
            startDate,
            endDate
        );
    }

    /**
     * Bulk generate QR codes for all vehicles in a fleet
     */
    async bulkGenerateFleetQRs(fleetId: string) {
        const vehicles = await prisma.vehicle.findMany({
            where: { fleetId },
            select: { id: true },
        });

        const results = [];

        for (const vehicle of vehicles) {
            try {
                const qr = await this.generateVehicleQR(vehicle.id);
                results.push({ vehicleId: vehicle.id, success: true, qr });
            } catch (error: any) {
                results.push({ vehicleId: vehicle.id, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Get all virtual QRs for a fleet
     */
    async getFleetQRs(fleetId: string) {
        return prisma.virtualQR.findMany({
            where: {
                vehicle: {
                    fleetId,
                },
            },
            include: {
                vehicle: {
                    select: {
                        vehicleNumber: true,
                    },
                },
            },
        });
    }
}

export const virtualQRService = new VirtualQRService();
