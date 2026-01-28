import { ConstraintInput, ConstraintResult } from "./constraint.types.js";
import { TripType } from "@prisma/client";


/**
 * Supported cities for trip origin.
 * Currently limited to Delhi NCR region for operational coverage.
 */
const NCR_CITIES = ["DELHI", "GURGAON", "NOIDA", "FARIDABAD", "GHAZIABAD", "BANGALORE"];

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

function validatePrebookWindow(pickupTime: Date): ConstraintResult {
    const now = new Date();

    // DEVELOPMENT: Allow booking if pickup is at least 1 minute from now
    if (process.env.NODE_ENV === "development") {
        const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
        if (pickupTime < oneMinuteFromNow) {
            return {
                allowed: false,
                reason: `In Development mode, pickup time must be at least 1 minute in the future. (After ${oneMinuteFromNow.toLocaleTimeString()})`
            };
        }
        return { allowed: true };
    }

    // PRODUCTION / STAGING: Strict "Next Day 4 AM" rule
    const tomorrow4AM = new Date(now);
    tomorrow4AM.setDate(now.getDate() + 1);
    tomorrow4AM.setHours(4, 0, 0, 0);

    if (pickupTime < tomorrow4AM) {
        return {
            allowed: false,
            reason: `Pre-booked trips must be scheduled for the next calendar day from 4:00 AM onwards (After ${tomorrow4AM.toLocaleString()})`
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

        return validatePrebookWindow(input.pickupTime);
    },

    [TripType.RENTAL]: (input: ConstraintInput): ConstraintResult => {
        const originCheck = validateOrigin(input.originCity);
        if (!originCheck.allowed) return originCheck;

        if (!input.isPrebook) {
            return { allowed: false, reason: "Rental trips must be pre-booked" };
        }

        return validatePrebookWindow(input.pickupTime);
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
