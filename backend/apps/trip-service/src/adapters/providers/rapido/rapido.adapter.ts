import { ExternalRideProvider } from "../../../core/trip/contracts/external-provider.contract.js";
import { ExternalBooking } from "../../../core/trip/contracts/booking.contract.js";

export class RapidoAdapter implements ExternalRideProvider {
    searchFare(_input: any): Promise<any[]> {
        throw new Error("Method not implemented. Rapido is a Demand Source (Fleet), not a Supply Provider.");
    }

    prebook(_input: any): Promise<ExternalBooking> {
        throw new Error("Method not implemented. Rapido is a Demand Source (Fleet), not a Supply Provider.");
    }

    confirmPayment(_input: any): Promise<void> {
        throw new Error("Method not implemented. Rapido is a Demand Source (Fleet), not a Supply Provider.");
    }

    cancelBooking(_input: any): Promise<void> {
        // We might want to support cancelling if we accepted it?
        // But usually cancellations come via webhook.
        throw new Error("Method not implemented. Use 'changeCaptainStatus' or handle webhooks.");
    }

    getBookingDetails(_input: any): Promise<any> {
        throw new Error("Method not implemented.");
    }

    trackRide(_input: any): Promise<any> {
        throw new Error("Method not implemented.");
    }

    getRideStatus(_providerBookingId: string): Promise<string> {
        throw new Error("Method not implemented. Rapido is a Demand Source (Fleet), not a Supply Provider.");
    }
}
