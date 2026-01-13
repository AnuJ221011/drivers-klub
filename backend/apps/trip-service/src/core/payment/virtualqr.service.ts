import { prisma } from "@driversklub/database";
import { easebuzzAdapter } from '../../adapters/easebuzz/easebuzz.adapter.js';

export class VirtualQRService {
    /**
     * Generate virtual QR code for a vehicle
     */
    async generateVehicleQR(vehicleId: string) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: { fleet: true },
        });

        if (!vehicle) {
            throw new Error('Vehicle not found');
        }

        // Check if QR already exists
        const existingQR = await prisma.virtualQR.findFirst({
            where: { vehicleId },
        });

        if (existingQR) {
            return existingQR;
        }

        // Create virtual account via Easebuzz
        const virtualAccount = await easebuzzAdapter.createVirtualAccount({
            vehicleNumber: vehicle.vehicleNumber,
            vehicleId: vehicle.id,
            fleetName: vehicle.fleet.name,
            customerMobile: vehicle.fleet.mobile,
            customerEmail: vehicle.fleet.mobile + '@driversklub.com',
        });

        // Store in database
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

        return virtualQR;
    }

    /**
     * Get virtual QR for a vehicle
     */
    async getVehicleQR(vehicleId: string) {
        return prisma.virtualQR.findFirst({
            where: { vehicleId },
            include: { vehicle: true },
        });
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
