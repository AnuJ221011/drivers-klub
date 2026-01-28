export class ExtraCharges {
    /**
     * Calculate Night Charges based on pickup time.
     * Logic: 25% of base fare OR ₹250 flat (whichever is higher) if trip is between 11 PM and 5 AM.
     * Since we might not always have base fare available during this calculation context or want to enforce flat 250 as per some MMT standards,
     * we'll support an optional baseFare. If not provided, defaults to 0 for percentage calc (meaning flat 250 applies if time matches).
     * 
     * @param pickupTime - The date and time of the pickup
     * @param baseFare - Optional base fare to calculate 25% surcharge
     */
    static calculateNightCharge(pickupTime: Date, baseFare: number = 0): number {
        const hours = pickupTime.getHours();

        // Night hours: 11 PM (23) to 5 AM (5)
        // Inclusive of 23:00, exclusive of 05:00? Usually 23:00 to 05:00.
        const isNightTime = hours >= 23 || hours < 5;

        if (!isNightTime) {
            return 0;
        }

        // 25% of base fare or 250 flat
        const percentageCharge = 0.25 * baseFare;
        const flatCharge = 250;

        return Math.max(percentageCharge, flatCharge);
    }

    /**
     * Calculate Airport Entry Fee based on trip type.
     * Logic: Fixed ₹270 for AIRPORT trips.
     * 
     * @param tripType - Type of the trip (e.g., AIRPORT, INTER_CITY, RENTAL)
     */
    static calculateAirportCharge(tripType: string | undefined): number {
        if (!tripType) return 0;

        // Check if tripType is AIRPORT (case-insensitive just in case, though standard is uppercase)
        if (tripType.toUpperCase() === 'AIRPORT') {
            return 270;
        }

        return 0;
    }
}
