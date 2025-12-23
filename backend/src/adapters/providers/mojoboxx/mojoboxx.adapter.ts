
import { ExternalRideProvider } from "@/core/trip/contracts/external-provider.contract.js";
import { ExternalBooking } from "@/core/trip/contracts/booking.contract.js";
import { ProviderType } from "@/shared/enums/provider.enum.js";
import { mojoRequest } from "./mojoboxx.client.js";
import { mapFareResponse } from "./mojoboxx.mapper.js";

export class MojoBoxxAdapter implements ExternalRideProvider {

    async searchFare(input: any) {
        const res = await mojoRequest("POST", "/api/v1/booking/fareSearch", input);
        return mapFareResponse(res.data);
    }

    async prebook(input: any): Promise<ExternalBooking> {
        // Map internal trip to MojoBoxx payload
        const payload = {
            tripId: "MOCK_TRIP",
            pickup: input.originCity,
            drop: input.destinationCity,
        };

        try {
            // MOCKING response
            return {
                provider: ProviderType.MOJOBOXX,
                externalBookingId: `MB-${Date.now()}`,
                rawPayload: payload
            };
        } catch (error: any) {
            throw new Error(error.message || "MojoBoxx booking failed");
        }
    }

    async confirmPayment(input: any): Promise<void> {
        await mojoRequest("POST", "/api/v1/booking/paymentConfirmation", input);
    }

    async cancelBooking(providerBookingId: string): Promise<void> {
        await mojoRequest("POST", "/api/v1/booking/cancelBooking", { bookingId: providerBookingId });
    }

    async getBookingDetails(input: any) {
        return mojoRequest(
            "GET",
            `/api/v1/booking/bookingDetails?bookingId=${input.bookingId}`
        );
    }

    async trackRide(_: any) {
        // Return structured data for controller parity
        return {
            data: {
                source: { lat: 28.50, lng: 77.05 },
                destination: { lat: 28.60, lng: 77.15 },
                live: { lat: 28.55, lng: 77.10 }
            }
        };
    }
}
