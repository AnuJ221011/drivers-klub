import { prisma } from "@/utils/prisma.js";
import { ProviderBookingStatus } from "@prisma/client";
import { ProviderFactory } from "./provider.factory.js";

export class ProviderCancellationService {
    static async cancelTripProviderBooking(tripId: string) {
        const trip = await prisma.ride.findUnique({
            where: { id: tripId },
        });

        if (!trip || !trip.providerBookingId || !trip.provider) return;

        try {
            const adapter = ProviderFactory.getProvider(trip.provider);

            await adapter.cancelBooking(
                trip.providerBookingId
            );

            await prisma.ride.update({
                where: { id: tripId },
                data: {
                    providerStatus: ProviderBookingStatus.CANCELLED,
                    providerMeta: {},
                },
            });

        } catch (error) {
            // ❗ NEVER block trip cancellation
            console.error(
                "[PROVIDER_CANCEL_FAILED]",
                error instanceof Error ? error.message : error
            );
        }
    }
}
