import { TripType } from "@prisma/client";

export type ConstraintInput = {
    tripType: TripType;
    pickupTime: Date;
    distanceKm: number;
    vehicleType: "EV" | "NON_EV";
    isPrebook: boolean;
    originCity: string;
};

export type ConstraintResult = {
    allowed: boolean;
    reason?: string;
};

// Slot Types (Part 3)
export type ExistingAssignment = {
    tripType: TripType;
    pickupTime: Date;
};

export type SlotConstraintInput = {
    tripType: TripType;
    pickupTime: Date;
    existingAssignments: ExistingAssignment[];
};
