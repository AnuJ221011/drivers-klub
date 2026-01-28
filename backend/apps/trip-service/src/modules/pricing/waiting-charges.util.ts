export class WaitingCharges {
    static calculate(arrivedAt: Date, boardedAt: Date): number {
        const FREE_TIME_MINUTES = 45;
        const CHARGE_PER_BLOCK = 100; // ₹100
        const BLOCK_DURATION_MINUTES = 30;

        // Calculate total waiting time in minutes
        const waitingTimeMs = boardedAt.getTime() - arrivedAt.getTime();
        const waitingTimeMinutes = Math.floor(waitingTimeMs / (1000 * 60));

        // No charge if within free time
        if (waitingTimeMinutes <= FREE_TIME_MINUTES) {
            return 0;
        }

        // Calculate chargeable time
        const chargeableMinutes = waitingTimeMinutes - FREE_TIME_MINUTES;

        // Calculate number of 30-min blocks (round up)
        const blocks = Math.ceil(chargeableMinutes / BLOCK_DURATION_MINUTES);

        return blocks * CHARGE_PER_BLOCK;
    }
}
