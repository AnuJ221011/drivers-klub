import { RideStatus } from "../../../shared/enums/ride-status.enum.js";
import { ProviderType } from "../../../shared/enums/provider.enum.js";

export function mapProviderStatusToRideStatus(
    provider: ProviderType,
    providerStatus: string
): RideStatus {
    // MOJOBOXX Mapping
    if (provider === ProviderType.MOJOBOXX) {
        switch (providerStatus.toLowerCase()) {
            case "confirmed":
            case "driver_assigned":
                return RideStatus.CONFIRMED;
            case "reached_pickup":
                return RideStatus.STARTED; // Or separate ARRIVED status if available
            case "boarded":
            case "trip_started":
                return RideStatus.STARTED;
            case "completed":
                return RideStatus.COMPLETED;
            case "cancelled":
                return RideStatus.CANCELLED;
            default:
                return RideStatus.CREATED;
        }
    }

    // MMT Mapping
    if (provider === ProviderType.MMT) {
        switch (providerStatus.toLowerCase()) {
            case "confirmed":
            case "allocated":
                return RideStatus.CONFIRMED;
            case "arrived_at_pickup":
                return RideStatus.STARTED; // Mapping 'Arrived' to Started/Active flow
            case "on_trip":
            case "started":
                return RideStatus.STARTED;
            case "completed":
            case "billed":
                return RideStatus.COMPLETED;
            case "cancelled":
            case "no_show":
                return RideStatus.CANCELLED;
            default:
                return RideStatus.CREATED;
        }
    }

    return RideStatus.CREATED;
}
