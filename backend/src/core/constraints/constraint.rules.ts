import { ConstraintInput, ConstraintResult } from "./constraint.types.js";
import { TripType } from "@prisma/client";


const NCR_CITIES = ["DELHI", "GURGAON", "NOIDA", "FARIDABAD", "GHAZIABAD"];

function validateOrigin(origin: string): ConstraintResult {
    const normalized = origin.toUpperCase();
    if (!NCR_CITIES.includes(normalized)) {
        return {
            allowed: false,
            reason: `Origin city must be in Delhi NCR. Allowed: ${NCR_CITIES.join(", ")}`
        };
    }
    return { allowed: true };
}

export const constraintRules = {
    [TripType.AIRPORT]: (input: ConstraintInput): ConstraintResult => {
        const originCheck = validateOrigin(input.originCity);
        if (!originCheck.allowed) return originCheck;

        if (!input.isPrebook) {
            return { allowed: false, reason: "Airport trips must be pre-booked" };
        }

        return { allowed: true };
    },

    [TripType.RENTAL]: (input: ConstraintInput): ConstraintResult => {
        const originCheck = validateOrigin(input.originCity);
        if (!originCheck.allowed) return originCheck;

        if (!input.isPrebook) {
            return { allowed: false, reason: "Rental trips must be pre-booked" };
        }

        return { allowed: true };
    },

    [TripType.INTER_CITY]: (input: ConstraintInput): ConstraintResult => {
        const originCheck = validateOrigin(input.originCity);
        if (!originCheck.allowed) return originCheck;

        if (input.vehicleType === "EV" && input.distanceKm > 250) {
            return {
                allowed: false,
                reason: "Long inter-city trips not allowed for EV",
            };
        }

        return { allowed: true };
    },
};
