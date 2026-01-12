
export interface RapidoLocation {
    lat: string | number;
    lng: string | number;
}

export interface RapidoOrderStatusCallbackDto {
    phone: string;
    pickupLocation: RapidoLocation;
    dropLocation: RapidoLocation;
    estimatedDistance: number;
    estimatedTimeToDrop: string;
    status: RapidoOrderStatus;
    orderId: string;
    tripFare?: number;
    reason?: string;
}

export type RapidoOrderStatus =
    | 'accepted'
    | 'arrived'
    | 'started'
    | 'dropped'
    | 'customerCancelled'
    | 'riderCancelled'
    | 'aborted'
    | 'reassigned';

export interface RapidoCaptainStatusCallbackDto {
    status: 'online' | 'offline';
    phone: string;
    vehicleNumber?: string;
}

export interface RapidoChangeCaptainStatusRequestDto {
    status: 'online' | 'offline';
    vehicleNo?: string;
    captainMobile: string;
}
