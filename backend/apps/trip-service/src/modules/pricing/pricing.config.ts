import { TripType } from "@prisma/client";

export const PRICE_PER_KM = 25;
export const MIN_BILLABLE_KM = 5;

export const TRIP_TYPE_MULTIPLIER: Record<TripType, number> = {
    AIRPORT: 1.0,
    RENTAL: 1.1,
    INTER_CITY: 1.2,
};

export const BOOKING_TIME_MULTIPLIER = {
    T_1: 1.0,   // same day / next day
    T_2: 0.95,  // booked earlier
};

export const VEHICLE_MULTIPLIER = {
    EV: 1.0,
    NON_EV: 1.1,
};
