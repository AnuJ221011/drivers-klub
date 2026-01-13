import { SlotConstraintInput } from "./constraint.types.js";
import { TripType } from "@prisma/client";

export function validateSlot(
    input: SlotConstraintInput
): { allowed: boolean; reason?: string } {

    const pickupTs = input.pickupTime.getTime();

    for (const existing of input.existingAssignments) {
        const existingTs = existing.pickupTime.getTime();
        const diffMinutes = Math.abs(pickupTs - existingTs) / (1000 * 60);

        // Airport buffer rule
        if (
            input.tripType === TripType.AIRPORT &&
            existing.tripType === TripType.AIRPORT &&
            diffMinutes < 60
        ) {
            return {
                allowed: false,
                reason: "Airport ride buffer violation (1 hour rule)",
            };
        }

        // Rental exclusivity rule
        if (
            input.tripType === TripType.RENTAL &&
            pickupTs && existing.pickupTime &&
            new Date(pickupTs).toDateString() === new Date(existing.pickupTime).toDateString()
        ) {
            return {
                allowed: false,
                reason: "Rental trip already assigned for the day",
            };
        }
    }

    return { allowed: true };
}
