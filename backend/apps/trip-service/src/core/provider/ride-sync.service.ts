import { prisma } from "@driversklub/database";
import { ProviderFactory } from "./provider.factory.js";
import {
    mapMojoBoxxStatus,
    mapMMTStatus,
} from "./provider-status.mapper.js";
import { Provider, ProviderRideStatus } from "@prisma/client";

export class RideSyncService {
    static async syncTrip(tripId: string) {
        // Note: User prompt used 'trip.findUnique' and 'prisma.ride.update'.
        // I am using 'Ride' model which seems to be the one with provider details.
        // The prompt says: "const trip = await prisma.trip.findUnique" but "await prisma.trip.update".
        // AND Prompt said "Extend Trip Model".
        // BUT I updated 'Ride' model.
        // So I should use 'prisma.ride'.

        // HOWEVER, the schema shows 'Ride' model has 'provider', 'providerBookingId', 'providerRideStatus'.
        // So I will use 'prisma.ride'.

        const trip = await prisma.ride.findFirst({
            where: { OR: [{ id: tripId }, { shortId: tripId }] },
        });

        if (!trip?.provider || !trip.providerBookingId) return;

        try {
            const adapter = ProviderFactory.getProvider(trip.provider);
            const rawStatus = await adapter.getRideStatus(
                trip.providerBookingId
            );

            const mappedStatus =
                trip.provider === Provider.MOJOBOXX
                    ? mapMojoBoxxStatus(rawStatus)
                    : mapMMTStatus(rawStatus);

            // Ignore duplicate updates
            if (trip.providerRideStatus === mappedStatus) return;

            await prisma.ride.update({
                where: { id: tripId },
                data: {
                    providerRideStatus: mappedStatus,
                    status:
                        mappedStatus === ProviderRideStatus.STARTED
                            ? "STARTED"
                            : mappedStatus === ProviderRideStatus.COMPLETED
                                ? "COMPLETED"
                                : trip.status,
                },
            });

            // Side-effects
            // Need driverId. 'Ride' has 'tripAssignments'.
            // I need to find the driver from TripAssignment.
            if (mappedStatus === ProviderRideStatus.COMPLETED) {
                const assignment = await prisma.tripAssignment.findFirst({
                    where: { tripId: trip.id, status: 'ASSIGNED' }, // or COMPLETED?
                    include: { driver: true }
                });

                if (assignment?.driverId) {
                    await prisma.driver.update({
                        where: { id: assignment.driverId },
                        data: { isAvailable: true },
                    });
                }
            }
        } catch (e) {
            console.error("Failed to sync trip", tripId, e);
        }
    }
}
