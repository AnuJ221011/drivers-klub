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
 * - POST /dispatch/{booking_id}/detach (booking cancellation from vendor)
 * - POST /track/{booking_id}/start
 * - POST /track/{booking_id}/arrived
 * - POST /track/{booking_id}/boarded
 * - POST /track/{booking_id}/alight
 * - POST /track/{booking_id}/not-boarded
 * - PUT  /track/{booking_id}/update (location update)
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
     * Format ID for MMT (Max 10 chars)
     * - If UUID: Truncate to first 10 chars (remove hyphens)
     * - If ShortID (14 chars): Smart Compress to 10 chars
     *   e.g. DRV20260127001 -> D260127001
     *   e.g. VEH20260127001 -> V260127001
     */
    private formatMMTId(id: string): string {
        if (!id) return "UNKNOWN";

        // 1. UUID Case (Contains hyphens) -> Truncate
        if (id.includes('-')) {
            return id.replace(/-/g, '').substring(0, 10);
        }

        // 2. Short ID Case (14 chars, e.g. DRV20260127001) -> Compress
        if (id.length > 10) {
            // Check for known prefixes
            const prefix = id.substring(0, 3); // DRV, VEH, etc.
            const dateYear = id.substring(3, 7); // 2026
            const rest = id.substring(7); // 0127001 (MMDD + Serial)

            // Compression Strategy: 
            // - Take 1st char of Prefix (D/V)
            // - Skip Century '20' (Take 26)
            // - Keep rest (MMDD + Serial)
            // Result: 1 + 2 + 7 = 10 chars

            if (dateYear.startsWith('20')) {
                return `${prefix[0]}${dateYear.substring(2)}${rest}`;
            }

            // Fallback: Just take last 10 chars if format doesn't match expected year
            return id.slice(-10);
        }

        // 3. Already short enough
        return id;
    }

    /**
     * @deprecated Use formatMMTId instead
     */
    private shortenId(id: string): string {
        return this.formatMMTId(id);
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
    private async getDriverVehicle(driverIdInput: string): Promise<{ id: string; shortId: string | null; number: string; name: string; color: string; type: string } | null> {
        try {
            // Resolve Driver UUID first to ensure Assignment lookup works
            const driver = await prisma.driver.findFirst({
                where: { OR: [{ id: driverIdInput }, { shortId: driverIdInput }] },
                select: { id: true, shortId: true }
            });

            if (!driver) {
                logger.warn(`[MMT Tracking] Driver not found for ID: ${driverIdInput}`);
                return null;
            }

            const assignment = await prisma.assignment.findFirst({
                where: {
                    driverId: driver.id,
                    status: 'ACTIVE'
                },
                include: {
                    vehicle: true
                }
            });

            if (!assignment?.vehicle) return null;

            return {
                id: assignment.vehicle.id,
                shortId: assignment.vehicle.shortId, // Return shortId
                number: assignment.vehicle.vehicleNumber,
                name: `${assignment.vehicle.vehicleName} ${assignment.vehicle.vehicleModel}`,
                color: assignment.vehicle.vehicleColor || "White",
                type: "sedan"
            };
        } catch (error) {
            logger.error(`[MMT Tracking] Failed to fetch vehicle for driver ${driverIdInput}`);
            return null;
        }
    }

    // ============================================
    // DISPATCH EVENTS
    // ============================================

    /**
     * Notify MMT when driver is assigned to a booking
     * POST /dispatch/{booking_id}/assign
     * 
     * MMT Requirements:
     * - chauffeur.id must be ≤ 10 characters
     * - vehicle details are REQUIRED
     */
    async assignChauffeur(bookingId: string, driver: {
        id: string;
        shortId?: string | null;
        firstName: string;
        lastName?: string | null;
        mobile: string;
        profilePic?: string | null;
    }): Promise<boolean> {
        const vehicle = await this.getDriverVehicle(driver.id);

        // MMT requires vehicle details - fail if not available
        if (!vehicle) {
            logger.error(`[MMT Tracking] Cannot assign driver ${driver.id} - no active vehicle assignment`);
            return false;
        }

        const payload = {
            booking_id: bookingId,
            chauffeur: {
                id: this.formatMMTId(driver.shortId || driver.id),
                name: `${driver.firstName} ${driver.lastName || ''}`.trim(),
                mobile_number: driver.mobile,
                image: driver.profilePic || ""
            },
            vehicle: {
                id: this.formatMMTId(vehicle.shortId || vehicle.id),
                name: vehicle.name,
                color: vehicle.color,
                registration_number: vehicle.number,
                vehicle_type: vehicle.type
            }
        };

        return this.pushEvent("POST", `/dispatch/${bookingId}/assign`, payload, bookingId);
    }

    /**
     * Notify MMT when driver is reassigned to a booking
     * POST /dispatch/{booking_id}/reassign
     * 
     * MMT Requirements:
     * - chauffeur.id must be ≤ 10 characters
     * - vehicle details are REQUIRED
     */
    async reassignChauffeur(bookingId: string, driver: {
        id: string;
        shortId?: string | null;
        firstName: string;
        lastName?: string | null;
        mobile: string;
        profilePic?: string | null;
    }): Promise<boolean> {
        const vehicle = await this.getDriverVehicle(driver.id);

        // MMT requires vehicle details - fail if not available
        if (!vehicle) {
            logger.error(`[MMT Tracking] Cannot reassign driver ${driver.id} - no active vehicle assignment`);
            return false;
        }

        const payload = {
            booking_id: bookingId,
            chauffeur: {
                id: this.formatMMTId(driver.shortId || driver.id),
                name: `${driver.firstName} ${driver.lastName || ''}`.trim(),
                mobile_number: driver.mobile,
                image: driver.profilePic || ""
            },
            vehicle: {
                id: this.formatMMTId(vehicle.shortId || vehicle.id),
                name: vehicle.name,
                color: vehicle.color,
                registration_number: vehicle.number,
                vehicle_type: vehicle.type
            }
        };

        return this.pushEvent("POST", `/dispatch/${bookingId}/reassign`, payload, bookingId);
    }

    /**
     * Notify MMT to detach/cancel booking from vendor
     * POST /dispatch/{booking_id}/detach
     * 
     * Use Case: When vendor cannot fulfill the booking (no inventory, cancellation from vendor side)
     * Note: This is different from unassign (which removes driver but keeps booking active)
     * 
     * WARNING: May have penalties based on Service Level Agreement (SLA)
     */
    async detachBooking(bookingId: string, reason?: string): Promise<boolean> {
        const payload = {
            booking_id: bookingId,
            reason: reason || "No available inventory"
        };

        return this.pushEvent("POST", `/dispatch/${bookingId}/detach`, payload, bookingId);
    }

    /**
     * @deprecated This method is for the old /unassign endpoint which is no longer used
     * Use detachBooking() instead for cancelling bookings
     */
    async detachChauffeur(bookingId: string, reason?: string): Promise<boolean> {
        logger.warn(`[MMT Tracking] detachChauffeur is deprecated. Use detachBooking() instead.`);
        return this.detachBooking(bookingId, reason);
    }

    // ============================================
    // TRACK EVENTS
    // ============================================

    /**
     * Notify MMT when trip starts
     * POST /track/{booking_id}/start
     * 
     * Required: booking_id, device_id, latitude, longitude (as strings), timestamp
     */
    async trackStart(bookingId: string, lat: number, lng: number, driverId?: string): Promise<boolean> {
        const payload = {
            booking_id: bookingId,
            device_id: driverId ? this.shortenId(driverId) : "DKAPP001",
            latitude: String(lat),
            longitude: String(lng),
            timestamp: Date.now()
        };

        return this.pushEvent("POST", `/track/${bookingId}/start`, payload, bookingId);
    }

    /**
     * Notify MMT when driver arrives at pickup location
     * POST /track/{booking_id}/arrived
     * 
     * Required: booking_id, device_id, latitude, longitude (as strings), timestamp
     */
    async trackArrived(bookingId: string, lat: number, lng: number, driverId?: string): Promise<boolean> {
        const payload = {
            booking_id: bookingId,
            device_id: driverId ? this.shortenId(driverId) : "DKAPP001",
            latitude: String(lat),
            longitude: String(lng),
            timestamp: Date.now()
        };

        return this.pushEvent("POST", `/track/${bookingId}/arrived`, payload, bookingId);
    }

    /**
     * Notify MMT when passenger boards the vehicle
     * POST /track/{booking_id}/boarded
     * 
     * Required: booking_id, device_id, latitude, longitude (as strings), timestamp
     */
    async trackBoarded(bookingId: string, lat: number, lng: number, driverId?: string): Promise<boolean> {
        const payload = {
            booking_id: bookingId,
            device_id: driverId ? this.shortenId(driverId) : "DKAPP001",
            latitude: String(lat),
            longitude: String(lng),
            timestamp: Date.now()
        };

        return this.pushEvent("POST", `/track/${bookingId}/boarded`, payload, bookingId);
    }

    /**
     * Notify MMT when passenger alights (trip complete)
     * POST /track/{booking_id}/alight
     * 
     * Required: booking_id, device_id, latitude, longitude (as strings), timestamp
     * Optional: extra_charge, extra_fare_breakup
     */
    async trackAlight(bookingId: string, lat: number, lng: number, driverId?: string, extraCharges?: {
        night?: number;
        toll?: number;
        stateTax?: number;
        parking?: number;
        airportEntry?: number;
        waiting?: number;
        extraKms?: number;
        extraMinutes?: number;
    }): Promise<boolean> {
        const payload: any = {
            booking_id: bookingId,
            device_id: driverId ? this.shortenId(driverId) : "DKAPP001",
            latitude: String(lat),
            longitude: String(lng),
            timestamp: Date.now()
        };

        // Add extra charges in MMT format if provided (Test case 7)
        if (extraCharges) {
            const totalExtra = (extraCharges.night || 0) +
                (extraCharges.toll || 0) +
                (extraCharges.stateTax || 0) +
                (extraCharges.parking || 0) +
                (extraCharges.airportEntry || 0) +
                (extraCharges.waiting || 0);

            if (totalExtra > 0) {
                payload.extra_charge = totalExtra;
                payload.extra_fare_breakup = {};

                if (extraCharges.night) {
                    payload.extra_fare_breakup.night_charges = {
                        amount: extraCharges.night,
                        items: [{ name: "Night Charges", amount: extraCharges.night, receipt: null }]
                    };
                }
                if (extraCharges.toll) {
                    payload.extra_fare_breakup.toll_charges = {
                        amount: extraCharges.toll,
                        items: [{ name: "Toll Charges", amount: extraCharges.toll, receipt: null }]
                    };
                }
                if (extraCharges.stateTax) {
                    payload.extra_fare_breakup.state_tax = {
                        amount: extraCharges.stateTax,
                        items: [{ name: "State Tax", amount: extraCharges.stateTax, receipt: null }]
                    };
                }
                if (extraCharges.parking) {
                    payload.extra_fare_breakup.parking_charges = {
                        amount: extraCharges.parking,
                        items: [{ name: "Parking Charges", amount: extraCharges.parking, receipt: null }]
                    };
                }
                if (extraCharges.airportEntry) {
                    payload.extra_fare_breakup.airport_entry_fee = {
                        amount: extraCharges.airportEntry,
                        items: [{ name: "Airport Entry", amount: extraCharges.airportEntry, receipt: null }]
                    };
                }
                if (extraCharges.waiting) {
                    payload.extra_fare_breakup.waiting_charges = {
                        amount: extraCharges.waiting,
                        items: [{ name: "Waiting Charges", amount: extraCharges.waiting, receipt: null }]
                    };
                }
            }
        }

        return this.pushEvent("POST", `/track/${bookingId}/alight`, payload, bookingId);
    }

    /**
     * Notify MMT when passenger is a no-show
     * POST /track/{booking_id}/not-boarded
     * 
     * Required: booking_id, device_id, latitude, longitude (as strings), timestamp
     */
    async trackNotBoarded(bookingId: string, lat: number, lng: number, driverId?: string, reason?: string): Promise<boolean> {
        const payload = {
            booking_id: bookingId,
            device_id: driverId ? this.shortenId(driverId) : "DKAPP001",
            latitude: String(lat),
            longitude: String(lng),
            timestamp: Date.now(),
            reason: reason || "Customer no show"
        };

        return this.pushEvent("POST", `/track/${bookingId}/not-boarded`, payload, bookingId);
    }

    /**
     * Send live location update during trip
     * PUT /track/{booking_id}/update
     * 
     * Required: booking_id, device_id, latitude, longitude (as strings), timestamp
     * Should be called every 30 seconds from Start until Alight
     */
    async updateLocation(bookingId: string, lat: number, lng: number, driverId?: string): Promise<boolean> {
        const payload = {
            booking_id: bookingId,
            device_id: driverId ? this.shortenId(driverId) : "DKAPP001",
            latitude: String(lat),
            longitude: String(lng),
            timestamp: Date.now()
        };

        return this.pushEvent("PUT", `/track/${bookingId}/update`, payload, bookingId);
    }
}

// Singleton instance
export const mmtTracking = new MMTTracking();
