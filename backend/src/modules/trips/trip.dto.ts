import { RideStatus } from "../../shared/enums/ride-status.enum.js";

export interface TripResponseDto {
    id: string;
    status: RideStatus;
    provider?: string;
    tripType: string;
    originCity: string;
    destinationCity: string;
    pickupLocation?: string;
    dropLocation?: string;
    price?: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
}

export interface TrackingResponseDto {
    source: {
        lat: number;
        lng: number;
    };
    destination: {
        lat: number;
        lng: number;
    };
    live: {
        lat: number;
        lng: number;
    };
}
