import api from './axios';

export type PublicTripType = 'AIRPORT' | 'RENTAL' | 'INTER_CITY';

export type PublicTripPricingInput = {
  pickupLocation: string;
  dropLocation: string;
  tripDate: string;
  tripTime: string;
  tripType: PublicTripType;
};

export type PublicTripPricing = {
  vehicleSku: string;
  vehicleType: string;
  tripType: PublicTripType;
  distanceKm: number;
  billableDistanceKm: number;
  ratePerKm: number;
  baseFare: number;
  totalFare: number;
  breakdown: {
    distanceFare: number;
    tripTypeMultiplier: number;
    bookingTimeMultiplier: number;
    vehicleMultiplier: number;
  };
  currency: string;
};

export type PublicTripCreateInput = PublicTripPricingInput & {
  customerName: string;
  customerPhone: string;
};

export type PublicTripCreateResponse = {
  tripId: string;
  status:
    | 'CREATED'
    | 'DRIVER_ASSIGNED'
    | 'STARTED'
    | 'COMPLETED'
    | 'CANCELLED';
  vehicleSku: string;
  vehicleType?: string;
  vehilceType?: string;
  tripType: PublicTripType;
  price: number;
  pickupLocation: string;
  dropLocation: string;
  tripDate: string;
  customerName: string;
  customerPhone: string;
};

type PublicResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

function unwrapPublic<T>(data: unknown, fallback: string): T {
  if (data && typeof data === 'object' && 'success' in data) {
    const payload = data as PublicResponse<T>;
    if (!payload.success) {
      throw new Error(payload.message || fallback);
    }
    if (payload.data !== undefined) {
      return payload.data;
    }
  }
  return data as T;
}

export async function getPublicTripPricing(
  payload: PublicTripPricingInput
): Promise<PublicTripPricing> {
  const res = await api.post<
    PublicTripPricing | PublicResponse<PublicTripPricing>
  >('/public/trips/pricing', payload);
  return unwrapPublic(res.data, 'Failed to fetch trip pricing');
}

export async function createPublicTrip(
  payload: PublicTripCreateInput
): Promise<PublicTripCreateResponse> {
  const res = await api.post<
    PublicTripCreateResponse | PublicResponse<PublicTripCreateResponse>
  >('/public/trips/create', payload);
  return unwrapPublic(res.data, 'Failed to create trip');
}
