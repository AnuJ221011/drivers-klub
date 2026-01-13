export interface MMTFareRequest {
    source: string;
    destination: string;
    pickupTime: string;
}

export interface MMTBookingRequest {
    fareId: string;
    passengerDetails: {
        name: string;
        phone: string;
    };
}
