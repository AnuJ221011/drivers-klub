import { logger } from "@driversklub/common";

export class MMTWebhook {
    // private baseUrl: string;
    // private apiKey: string;

    constructor() {
        // this.baseUrl = process.env.MMT_WEBHOOK_URL || "https://api-mock.mmt.com/v1/callbacks";
        // this.apiKey = process.env.MMT_API_KEY || "mock-key";
    }

    private async pushEvent(endpoint: string, payload: any) {
        try {
            logger.info(`[MMT Webhook] Pushing ${endpoint} for Trip ${payload.tripId}`);
            // In a real scenario, we would await axios.post
            // await axios.post(`${this.baseUrl}${endpoint}`, payload, { headers: { "Authorization": this.apiKey } });

            // Simulating success
            logger.info(`[MMT Webhook] Success: ${endpoint}`);
            return true;
        } catch (error: any) {
            logger.error(`[MMT Webhook] Failed to push ${endpoint}: ${error.message}`);
            // We might want to queue this for retry in a real production system
            return false;
        }
    }

    async pushDriverAssignment(tripId: string, driver: any) {
        return this.pushEvent("/driver-assigned", {
            tripId,
            driverName: `${driver.firstName} ${driver.lastName}`,
            driverPhone: driver.mobile,
            vehicleNumber: "DL01ABC1234" // Should fetch from assignment
        });
    }

    async pushStartTrip(tripId: string, lat: number, lng: number) {
        return this.pushEvent("/start", {
            tripId,
            timestamp: new Date().toISOString(),
            location: { lat, lng }
        });
    }

    async pushArrived(tripId: string, lat: number, lng: number) {
        return this.pushEvent("/arrived", {
            tripId,
            timestamp: new Date().toISOString(),
            location: { lat, lng }
        });
    }

    async pushOnboard(tripId: string, otp: string) {
        return this.pushEvent("/pickup", {
            tripId,
            timestamp: new Date().toISOString(),
            otp
        });
    }

    async pushComplete(tripId: string, distance: number, fare: number) {
        return this.pushEvent("/alight", {
            tripId,
            timestamp: new Date().toISOString(),
            finalDetails: {
                distance,
                fare
            }
        });
    }

    async pushNoShow(tripId: string) {
        return this.pushEvent("/not_boarded", {
            tripId,
            timestamp: new Date().toISOString(),
            reason: "Customer No Show"
        });
    }

    async pushUpdateLocation(tripId: string, lat: number, lng: number) {
        return this.pushEvent("/update-location", {
            tripId,
            timestamp: new Date().toISOString(),
            location: { lat, lng }
        });
    }

    async pushReassignChauffeur(tripId: string, driver: any) {
        return this.pushEvent("/reassign-chauffeur", {
            tripId,
            timestamp: new Date().toISOString(),
            driver: {
                name: `${driver.firstName} ${driver.lastName}`,
                phone: driver.mobile,
                vehicle: "DL01ABC1234"
            }
        });
    }

    async pushDetachTrip(tripId: string, reason: string) {
        return this.pushEvent("/detach-trip", {
            tripId,
            timestamp: new Date().toISOString(),
            reason
        });
    }
}
