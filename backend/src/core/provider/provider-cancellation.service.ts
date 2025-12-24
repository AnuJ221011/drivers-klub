import { prisma } from "@/utils/prisma.js";
import { ProviderBookingStatus } from "@prisma/client";
import { ProviderFactory } from "./provider.factory.js";

export class ProviderCancellationService {
    static async cancelTripProviderBooking(tripId: string) {
        // Fetch Mapping
        const mapping = await prisma.rideProviderMapping.findUnique({
            where: { rideId: tripId },
        });

        if (!mapping || !mapping.externalBookingId) return;

        try {
            // Simplify: Direct resolve since factory might need updates. 
            // Better to use Registry if available, but for static service we use Factory/Adapter directly.
            // Assuming Factory exists and works:
            const adapter = ProviderFactory.getProvider(mapping.providerType as any);

            await adapter.cancelBooking(
                mapping.externalBookingId
            );

            await prisma.rideProviderMapping.update({
                where: { rideId: tripId },
                data: {
                    providerStatus: ProviderBookingStatus.CANCELLED,
                },
            });

            // Sync legacy status if needed
            await prisma.ride.update({
                where: { id: tripId },
                data: { providerStatus: ProviderBookingStatus.CANCELLED }
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
