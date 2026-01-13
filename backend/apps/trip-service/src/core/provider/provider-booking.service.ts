import { prisma } from "@driversklub/database";
import { Provider, ProviderBookingStatus } from "@prisma/client";
import { ProviderFactory } from "./provider.factory.js";

export class ProviderBookingService {
    static async bookAfterAssignment(
        tripId: string,
        assignmentId: string
    ) {
        const trip = await prisma.ride.findUnique({
            where: { id: tripId },
            include: { tripAssignments: true },
        });

        if (!trip) throw new Error("Trip not found");

        // Guard: booking already exists
        if (trip.providerBookingId) return;

        const assignment = trip.tripAssignments.find(a => a.id === assignmentId);
        if (!assignment) throw new Error("Assignment not found");

        // Decide provider (hardcoded or rule-based for now)
        // Decide provider:
        // 1. Check if Trip already has a preferred provider
        // 2. Or check Allocation logic
        // 3. Default to MMT if ambiguous
        let provider: Provider = trip.provider || Provider.MMT;

        // If the Orchestrator set a provider type in Mapping (even if deferred), we should respect it
        const mapping = await prisma.rideProviderMapping.findUnique({ where: { rideId: tripId } });
        if (mapping && mapping.providerType === "MOJOBOXX") provider = Provider.MOJOBOXX;
        if (mapping && mapping.providerType === "MMT") provider = Provider.MMT;

        await prisma.tripAssignment.update({
            where: { id: assignmentId },
            data: { bookingAttempted: true },
        });

        try {
            const adapter = ProviderFactory.getProvider(provider);

            const result = await adapter.prebook({
                trip,
                assignment,
                originCity: trip.originCity,
                destinationCity: trip.destinationCity || "Unknown"
            });

            // 4. Persist Mapping (Upsert in case it exists)
            await prisma.rideProviderMapping.upsert({
                where: { rideId: tripId },
                update: {
                    providerType: provider,
                    externalBookingId: result.externalBookingId,
                    providerStatus: "CONFIRMED",
                    rawPayload: result.rawPayload as any,
                },
                create: {
                    rideId: tripId,
                    providerType: provider,
                    externalBookingId: result.externalBookingId,
                    providerStatus: "CONFIRMED",
                    rawPayload: result.rawPayload as any,
                }
            });

            // Legacy Sync
            await prisma.ride.update({
                where: { id: tripId },
                data: {
                    provider: provider,
                    providerBookingId: result.externalBookingId,
                    providerStatus: ProviderBookingStatus.CONFIRMED,
                    providerMeta: result.rawPayload || {},
                },
            });

        } catch (error: any) {
            // 1. Mark assignment failed
            await prisma.tripAssignment.update({
                where: { id: assignmentId },
                data: {
                    bookingFailedReason: error.message,
                },
            });

            // 2. Free driver
            await prisma.driver.update({
                where: { id: assignment.driverId },
                data: { isAvailable: true },
            });

            // 3. Reset trip provider fields
            await prisma.ride.update({
                where: { id: tripId },
                data: {
                    providerStatus: ProviderBookingStatus.FAILED,
                },
            });

            // 4. Bubble error to OPS logs
            throw error;
        }
    }
}
