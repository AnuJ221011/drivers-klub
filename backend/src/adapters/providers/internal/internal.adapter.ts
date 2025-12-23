import { ExternalRideProvider } from "@/core/trip/contracts/external-provider.contract.js";
import { FareOption } from "@/core/trip/contracts/fare.contract.js";
import { ExternalBooking } from "@/core/trip/contracts/booking.contract.js";
import { ProviderType } from "@/shared/enums/provider.enum.js";

export class InternalRideProvider implements ExternalRideProvider {
  async searchFare(): Promise<FareOption[]> {
    return [
      {
        provider: ProviderType.INTERNAL,
        vehicleType: "SEDAN",
        capacity: 4,
        fare: 1000,
        currency: "INR",
      },
    ];
  }

  async prebook(): Promise<ExternalBooking> {
    return {
      provider: ProviderType.INTERNAL,
      externalBookingId: `INT-${Date.now()}`,
      rawPayload: { simulated: true },
    };
  }

  async confirmPayment(): Promise<void> {
    return;
  }

  async cancelBooking(): Promise<void> {
    return;
  }

  async getBookingDetails(): Promise<any> {
    return {
      status: "CONFIRMED",
    };
  }

  async trackRide(): Promise<any> {
    return {
      data: {
        source: { lat: 28.61, lng: 77.20 },
        destination: { lat: 28.50, lng: 77.05 },
        live: { lat: 28.55, lng: 77.10 }
      }
    };
  }
}
