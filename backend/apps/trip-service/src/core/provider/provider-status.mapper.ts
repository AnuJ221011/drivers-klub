import { ProviderRideStatus } from "@prisma/client";

export function mapMojoBoxxStatus(status: string): ProviderRideStatus {
    switch (status) {
        case "BOOKED":
            return ProviderRideStatus.BOOKED;
        case "DRIVER_ON_THE_WAY":
            return ProviderRideStatus.DRIVER_ASSIGNED;
        case "TRIP_STARTED":
            return ProviderRideStatus.STARTED;
        case "TRIP_COMPLETED":
            return ProviderRideStatus.COMPLETED;
        case "CANCELLED":
            return ProviderRideStatus.CANCELLED;
        default:
            return ProviderRideStatus.FAILED; // Or handle as unknown
    }
}

export function mapMMTStatus(status: string): ProviderRideStatus {
    switch (status) {
        case "CONFIRMED":
            return ProviderRideStatus.BOOKED;
        case "IN_PROGRESS":
            return ProviderRideStatus.STARTED;
        case "COMPLETED":
            return ProviderRideStatus.COMPLETED;
        case "CANCELLED":
            return ProviderRideStatus.CANCELLED;
        default:
            return ProviderRideStatus.FAILED;
    }
}
