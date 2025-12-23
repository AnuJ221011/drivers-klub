import { prisma } from "@/utils/prisma.js";
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
        const provider: Provider = Provider.MOJOBOXX;

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

            await prisma.ride.update({
                where: { id: tripId },
                data: {
                    provider,
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
