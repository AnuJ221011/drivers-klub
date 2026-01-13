import { ExternalRideProvider } from "../../../core/trip/contracts/external-provider.contract.js";
import { ExternalBooking } from "../../../core/trip/contracts/booking.contract.js";

export class RapidoAdapter implements ExternalRideProvider {
    searchFare(input: any): Promise<any[]> {
        throw new Error("Method not implemented. Rapido is a Demand Source (Fleet), not a Supply Provider.");
    }

    prebook(input: any): Promise<ExternalBooking> {
        throw new Error("Method not implemented. Rapido is a Demand Source (Fleet), not a Supply Provider.");
    }

    confirmPayment(input: any): Promise<void> {
        throw new Error("Method not implemented. Rapido is a Demand Source (Fleet), not a Supply Provider.");
    }

    cancelBooking(input: any): Promise<void> {
        // We might want to support cancelling if we accepted it?
        // But usually cancellations come via webhook.
        throw new Error("Method not implemented. Use 'changeCaptainStatus' or handle webhooks.");
    }

    getBookingDetails(input: any): Promise<any> {
        throw new Error("Method not implemented.");
    }

    trackRide(input: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
}
