import { ExternalRideProvider } from "../../../core/trip/contracts/external-provider.contract.js";
import { ExternalBooking } from "../../../core/trip/contracts/booking.contract.js";
// import { ProviderType } from "@/shared/enums/provider.enum.js";
import { Provider } from "@prisma/client";
import { mmtRequest } from "./mmt.client.js";
import { mapMMTFareResponse } from "./mmt.mapper.js";

export class MMTAdapter implements ExternalRideProvider {

    async searchFare(input: any) {
        // Example MMT endpoint for search
        const res = await mmtRequest("POST", "/api/v2/cabs/search", input);
        return mapMMTFareResponse(res.data);
    }

    async prebook(input: any): Promise<ExternalBooking> {
        const payload = {
            tripId: input.tripId || "TRIP-" + Date.now(),
            source: input.originCity,
            dest: input.destinationCity,
        };

        try {
            return {
                provider: Provider.MMT,
                externalBookingId: `MMT-${Date.now()}`,
                rawPayload: payload
            };
        } catch (error: any) {
            throw new Error(error.message || "MMT booking failed");
        }
    }

    async confirmPayment(input: any): Promise<void> {
        await mmtRequest("POST", "/api/v2/cabs/book", input);
    }

    async cancelBooking(providerBookingId: string): Promise<void> {
        await mmtRequest("POST", "/api/v2/cabs/cancel", { refId: providerBookingId });
    }

    async getBookingDetails(input: any) {
        return mmtRequest(
            "GET",
            `/api/v2/cabs/status/${input.bookingId}`
        );
    }

    async trackRide(_: any) {
        return {
            data: {
                source: { lat: 19.0760, lng: 72.8777 }, // Mumbai example
                destination: { lat: 18.5204, lng: 73.8567 }, // Pune example
                live: { lat: 19.0000, lng: 73.0000 }
            }
        };
    }
}
