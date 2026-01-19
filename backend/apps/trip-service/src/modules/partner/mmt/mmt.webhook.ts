import { logger } from "@driversklub/common";
import axios from "axios";
import { prisma } from "@driversklub/database";

const MMT_WEBHOOK_CONFIG = {
    baseUrl: process.env.MMT_WEBHOOK_URL || "",
    apiKey: process.env.MMT_API_KEY || ""
};

export class MMTWebhook {

    /**
     * Push an event to MMT's webhook endpoint
     */
    private async pushEvent(endpoint: string, payload: any): Promise<boolean> {
        const url = `${MMT_WEBHOOK_CONFIG.baseUrl}${endpoint}`;

        // Skip if no webhook URL configured
        if (!MMT_WEBHOOK_CONFIG.baseUrl) {
            logger.warn(`[MMT Webhook] No MMT_WEBHOOK_URL configured. Skipping ${endpoint}`);
            return false;
        }

        try {
            logger.info(`[MMT Webhook] Pushing ${endpoint} for Trip ${payload.tripId || payload.order_reference_number}`);

            const response = await axios.post(url, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${MMT_WEBHOOK_CONFIG.apiKey}`
                },
                timeout: 10000 // 10 second timeout
            });

            logger.info(`[MMT Webhook] Success: ${endpoint} - Status: ${response.status}`);
            return true;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            logger.error(`[MMT Webhook] Failed to push ${endpoint}: ${errorMsg}`);
            // In production, consider queuing for retry
            return false;
        }
    }

    /**
     * Get driver's active vehicle number
     */
    private async getDriverVehicleNumber(driverId: string): Promise<string | null> {
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
            return assignment?.vehicle?.vehicleNumber || null;
        } catch (error) {
            logger.error(`[MMT Webhook] Failed to fetch vehicle for driver ${driverId}`);
            return null;
        }
    }

    /**
     * Notify MMT when driver is assigned to a trip
     */
    async pushDriverAssignment(tripId: string, driver: any) {
        const vehicleNumber = await this.getDriverVehicleNumber(driver.id);

        return this.pushEvent(`/api/partner/v1/dispatch/${tripId}/assign`, {
            booking_id: tripId,
            chauffeur: {
                id: driver.id,
                name: `${driver.firstName} ${driver.lastName || ''}`.trim(),
                mobile_number: driver.mobile,
                image: driver.profilePic || "https://example.com/default-driver.png"
            },
            vehicle: {
                id: vehicleNumber, // Using reg number as ID if internal ID not available easily
                name: "TATA Tigor EV", // Hardcoded/Default if dynamic lookup complex
                color: "White",
                registration_number: vehicleNumber,
                vehicle_type: "sedan"
            }
        });
    }

    /**
     * Notify MMT when driver starts the trip
     */
    async pushStartTrip(tripId: string, lat: number, lng: number) {
        return this.pushEvent(`/api/partner/v1/track/${tripId}/start`, {
            // Payload usually empty or minimal for tracking events? 
            // Doc says "Initiates the trip". Example request not detailed for tracking events, but standard convention usually empty or timestamp.
            // However, "Validation for Event ... check on latitude and longitude".
            // So we send coordinates.
            latitude: lat,
            longitude: lng,
            timestamp: new Date().getTime() // "Timestamp must be in milliseconds"
        });
    }

    /**
     * Notify MMT when driver arrives at pickup location
     */
    async pushArrived(tripId: string, lat: number, lng: number) {
        return this.pushEvent(`/api/partner/v1/track/${tripId}/arrived`, {
            latitude: lat,
            longitude: lng,
            timestamp: new Date().getTime()
        });
    }

    /**
     * Notify MMT when passenger is onboarded (OTP verified)
     */
    async pushOnboard(tripId: string, otp: string) {
        return this.pushEvent(`/api/partner/v1/track/${tripId}/boarded`, {
            // Boarded event usually implies successful pickup
            latitude: 0, // Should be actual lat/lng
            longitude: 0,
            timestamp: new Date().getTime()
        });
    }

    /**
     * Notify MMT when trip is completed
     */
    async pushComplete(tripId: string, distance: number, fare: number) {
        return this.pushEvent(`/api/partner/v1/track/${tripId}/alight`, {
            latitude: 0, // Should be actual drop lat/lng
            longitude: 0,
            timestamp: new Date().getTime()
            // Fare details usually sent in 'add_payment' or handled separately, event is strictly for tracking
        });
    }

    /**
     * Notify MMT when customer is a no-show
     */
    async pushNoShow(tripId: string) {
        return this.pushEvent("/not_boarded", {
            order_reference_number: tripId,
            timestamp: new Date().toISOString(),
            reason: "Customer No Show"
        });
    }

    /**
     * Send live location updates during trip (called every 30 seconds)
     */
    async pushUpdateLocation(tripId: string, lat: number, lng: number) {
        return this.pushEvent(`/api/partner/v1/track/${tripId}/update`, {
            latitude: lat,
            longitude: lng,
            timestamp: new Date().getTime()
        });
    }

    /**
     * Notify MMT when driver is reassigned to a trip
     */
    async pushReassignChauffeur(tripId: string, driver: any) {
        const vehicleNumber = await this.getDriverVehicleNumber(driver.id);

        return this.pushEvent("/reassign-chauffeur", {
            order_reference_number: tripId,
            timestamp: new Date().toISOString(),
            new_driver_details: {
                name: `${driver.firstName} ${driver.lastName || ''}`.trim(),
                phone: driver.mobile,
                vehicle_number: vehicleNumber
            }
        });
    }

    /**
     * Notify MMT when trip is cancelled/detached
     */
    async pushDetachTrip(tripId: string, reason: string) {
        return this.pushEvent("/detach-trip", {
            order_reference_number: tripId,
            timestamp: new Date().toISOString(),
            cancellation_reason: reason
        });
    }
}
