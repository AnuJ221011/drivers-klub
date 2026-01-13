import { TripRules } from "../rules/trip.rules.js";

export class TripValidator {
  static validatePrebook(bookingDate: Date, tripDate: Date) {
  // Normalize both to date-only (midnight)
  const bookingDay = new Date(
    bookingDate.getFullYear(),
    bookingDate.getMonth(),
    bookingDate.getDate()
  );

  const tripDay = new Date(
    tripDate.getFullYear(),
    tripDate.getMonth(),
    tripDate.getDate()
  );

  const diffInDays =
    (tripDay.getTime() - bookingDay.getTime()) /
    (1000 * 60 * 60 * 24);

  if (diffInDays < 1) {
    throw new Error(
      "Pre-booked trips must be scheduled at least one day in advance"
    );
  }

  // Enforce next-day only (configurable later)
  if (diffInDays !== 1) {
    throw new Error(
      "Only next-day pre-booked trips are allowed"
    );
  }

  // Enforce >= 4 AM
  if (tripDate.getHours() < 4) {
    throw new Error(
      "Pre-booked trips must start after 4 AM"
    );
  }
}


  static validateCity(city: string) {
    if (!TripRules.ALLOWED_ORIGIN_CITIES.includes(city.toUpperCase())) {
      throw new Error("Origin city not allowed");
    }
  }

  static validateTripType(type: string) {
    if (!TripRules.ALLOWED_TRIP_TYPES.includes(type)) {
      throw new Error("Trip type not allowed");
    }
  }

  static validateVehicle(sku: string) {
    if (!TripRules.ALLOWED_VEHICLE_SKU.includes(sku)) {
      throw new Error("Vehicle not allowed for this trip");
    }
  }
}
