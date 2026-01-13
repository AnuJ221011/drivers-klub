export function getBookingBucket(
    bookingTime: Date,
    pickupTime: Date
): "T_1" | "T_2" {
    const diffHours =
        (pickupTime.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);

    return diffHours >= 24 ? "T_2" : "T_1";
}
