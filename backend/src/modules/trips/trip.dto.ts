import { RideStatus } from "../../shared/enums/ride-status.enum.js";

export interface TripResponseDto {
    id: string;
    status: RideStatus;
    provider: string;
    pickup: string;
    destination: string;
    fare?: number;
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
