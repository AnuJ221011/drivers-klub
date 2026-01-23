import { logger } from "@driversklub/common";
import axios from "axios";
import { prisma } from "@driversklub/database";

/**
 * MMT Tracking API Configuration
 * 
 * Base URL: https://cabs-partners-staging.makemytrip.com/tracking/pp2/api/partner/v1
 * Auth: Basic Auth (username:password)
 * 
 * Endpoints:
 * - POST /dispatch/{booking_id}/assign
 * - POST /dispatch/{booking_id}/reassign
 * - POST /dispatch/{booking_id}/detach
 * - POST /track/{booking_id}/start
 * - POST /track/{booking_id}/arrived
 * - POST /track/{booking_id}/boarded
 * - POST /track/{booking_id}/alight
 * - POST /track/{booking_id}/not-boarded
 * - PUT  /track/{booking_id}/location
 */

const MMT_TRACKING_CONFIG = {
    baseUrl: process.env.MMT_TRACKING_URL || "https://cabs-partners-staging.makemytrip.com/tracking/pp2/api/partner/v1",
    username: process.env.MMT_TRACKING_USER,
    password: process.env.MMT_TRACKING_PASS,
};

export class MMTTracking {

    /**
     * Get Basic Auth header
     */
    private getAuthHeader(): string {
        const credentials = Buffer.from(`${MMT_TRACKING_CONFIG.username}:${MMT_TRACKING_CONFIG.password}`).toString('base64');
        return `Basic ${credentials}`;
    }

    /**
     * Push an event to MMT's tracking endpoint
     */
    private async pushEvent(method: "POST" | "PUT", endpoint: string, payload: any, bookingId: string): Promise<boolean> {
        const url = `${MMT_TRACKING_CONFIG.baseUrl}${endpoint}`;

        try {
            logger.info(`[MMT Tracking] ${method} ${endpoint} for Booking ${bookingId}`, { payload });

            const response = await axios({
                method,
                url,
                data: payload,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": this.getAuthHeader()
                },
                timeout: 10000
            });

            logger.info(`[MMT Tracking] Success: ${endpoint} - Status: ${response.status}`, {
                bookingId,
                responseData: response.data
            });
            return true;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            const status = error.response?.status;
            logger.error(`[MMT Tracking] Failed ${method} ${endpoint}: ${errorMsg}`, {
                bookingId,
                status,
                error: errorMsg
            });
            // Don't throw - tracking failures shouldn't block trip operations
            return false;
        }
    }

    /**
     * Get driver's active vehicle details
     */
    private async getDriverVehicle(driverId: string): Promise<{ id: string; number: string; name: string; color: string; type: string } | null> {
        try {
            const assignment = await prisma.assignment.findFirst({
                where: {
                    driverId: driverId,
                    status: 'ACTIVE'
                },
                include: {
                    vehicle: true
                }
            });

            if (!assignment?.vehicle) return null;

            return {
                id: assignment.vehicle.id,
                number: assignment.vehicle.vehicleNumber,
                name: `${assignment.vehicle.vehicleName} ${assignment.vehicle.vehicleModel}`,
                color: assignment.vehicle.vehicleColor || "White",
                type: "sedan"
            };
        } catch (error) {
            logger.error(`[MMT Tracking] Failed to fetch vehicle for driver ${driverId}`);
            return null;
        }
    }

    // ============================================
    // DISPATCH EVENTS
    // ============================================

    /**
     * Notify MMT when driver is assigned to a booking
     * POST /dispatch/{booking_id}/assign
     */
    async assignChauffeur(bookingId: string, driver: {
        id: string;
        firstName: string;
        lastName?: string | null;
        mobile: string;
        profilePic?: string | null;
    }): Promise<boolean> {
        const vehicle = await this.getDriverVehicle(driver.id);

        const payload = {
            chauffeur: {
                id: driver.id,
                name: `${driver.firstName} ${driver.lastName || ''}`.trim(),
                mobile_number: driver.mobile,
                image: driver.profilePic || ""
            },
            vehicle: vehicle ? {
                id: vehicle.id,
                name: vehicle.name,
                color: vehicle.color,
                registration_number: vehicle.number,
                vehicle_type: vehicle.type
            } : null
        };

        return this.pushEvent("POST", `/dispatch/${bookingId}/assign`, payload, bookingId);
    }

    /**
     * Notify MMT when driver is reassigned to a booking
     * POST /dispatch/{booking_id}/reassign
     */
    async reassignChauffeur(bookingId: string, driver: {
        id: string;
        firstName: string;
        lastName?: string | null;
        mobile: string;
        profilePic?: string | null;
    }): Promise<boolean> {
        const vehicle = await this.getDriverVehicle(driver.id);

        const payload = {
            chauffeur: {
                id: driver.id,
                name: `${driver.firstName} ${driver.lastName || ''}`.trim(),
                mobile_number: driver.mobile,
                image: driver.profilePic || ""
            },
            vehicle: vehicle ? {
                id: vehicle.id,
                name: vehicle.name,
                color: vehicle.color,
                registration_number: vehicle.number,
                vehicle_type: vehicle.type
            } : null
        };

        return this.pushEvent("POST", `/dispatch/${bookingId}/reassign`, payload, bookingId);
    }

    /**
     * Notify MMT when driver is detached/unassigned from a booking
     * POST /dispatch/{booking_id}/detach
     */
    async detachChauffeur(bookingId: string, reason?: string): Promise<boolean> {
        const payload = {
            reason: reason || "Driver unassigned"
        };

        return this.pushEvent("POST", `/dispatch/${bookingId}/detach`, payload, bookingId);
    }

    // ============================================
    // TRACK EVENTS
    // ============================================

    /**
     * Notify MMT when trip starts
     * POST /track/{booking_id}/start
     */
    async trackStart(bookingId: string, lat: number, lng: number): Promise<boolean> {
        const payload = {
            latitude: lat,
            longitude: lng,
            timestamp: Date.now()
        };

        return this.pushEvent("POST", `/track/${bookingId}/start`, payload, bookingId);
    }

    /**
     * Notify MMT when driver arrives at pickup location
     * POST /track/{booking_id}/arrived
     */
    async trackArrived(bookingId: string, lat: number, lng: number): Promise<boolean> {
        const payload = {
            latitude: lat,
            longitude: lng,
            timestamp: Date.now()
        };

        return this.pushEvent("POST", `/track/${bookingId}/arrived`, payload, bookingId);
    }

    /**
     * Notify MMT when passenger boards the vehicle
     * POST /track/{booking_id}/boarded
     */
    async trackBoarded(bookingId: string, lat: number, lng: number): Promise<boolean> {
        const payload = {
            latitude: lat,
            longitude: lng,
            timestamp: Date.now()
        };

        return this.pushEvent("POST", `/track/${bookingId}/boarded`, payload, bookingId);
    }

    /**
     * Notify MMT when passenger alights (trip complete)
     * POST /track/{booking_id}/alight
     * 
     * @param extraCharges - Optional extra charges (toll, parking, etc.)
     */
    async trackAlight(bookingId: string, lat: number, lng: number, extraCharges?: {
        toll?: number;
        parking?: number;
        waiting?: number;
        other?: number;
    }): Promise<boolean> {
        const payload: any = {
            latitude: lat,
            longitude: lng,
            timestamp: Date.now()
        };

        // Add extra charges if provided (Test case 7)
        if (extraCharges) {
            payload.extra_charges = {
                toll_charges: extraCharges.toll || 0,
                parking_charges: extraCharges.parking || 0,
                waiting_charges: extraCharges.waiting || 0,
                other_charges: extraCharges.other || 0
            };
        }

        return this.pushEvent("POST", `/track/${bookingId}/alight`, payload, bookingId);
    }

    /**
     * Notify MMT when passenger is a no-show
     * POST /track/{booking_id}/not-boarded
     */
    async trackNotBoarded(bookingId: string, lat: number, lng: number, reason?: string): Promise<boolean> {
        const payload = {
            latitude: lat,
            longitude: lng,
            timestamp: Date.now(),
            reason: reason || "Customer no show"
        };

        return this.pushEvent("POST", `/track/${bookingId}/not-boarded`, payload, bookingId);
    }

    /**
     * Send live location update during trip
     * PUT /track/{booking_id}/location
     * 
     * Should be called every 30 seconds from Start until Alight
     */
    async updateLocation(bookingId: string, lat: number, lng: number): Promise<boolean> {
        const payload = {
            latitude: lat,
            longitude: lng,
            timestamp: Date.now()
        };

        return this.pushEvent("PUT", `/track/${bookingId}/location`, payload, bookingId);
    }
}

// Singleton instance
export const mmtTracking = new MMTTracking();
