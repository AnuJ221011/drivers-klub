import axios from './axios';

type PricingPreviewApiResponse = {
  success: boolean;
  data: {
    distanceSource: 'GOOGLE_MAPS' | 'CLIENT_PROVIDED';
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
    currency: 'INR';
  };
};

export type PricingPreviewInput = {
  tripType: string;
  tripDate: string;
  bookingDate: string;
  pickup?: string;
  drop?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  distanceKm?: number;
  vehicleType?: 'EV' | 'NON_EV';
  vehicleSku?: string;
};

export type PricingPreviewResult = {
  distanceKm: number;
  billableKm: number;
  ratePerKm: number;
  baseFare: number;
  distanceCharge: number;
  totalFare: number;
};

export async function previewPricing(
  payload: PricingPreviewInput
): Promise<PricingPreviewResult> {
  const res = await axios.post<PricingPreviewApiResponse>(
    '/pricing/preview',
    payload
  );

  const raw = res.data as PricingPreviewApiResponse | PricingPreviewApiResponse['data'];
  const data = 'data' in raw ? raw.data : raw;

  return {
    distanceKm: data.distanceKm,
    billableKm: data.billableDistanceKm,
    ratePerKm: data.ratePerKm,
    baseFare: data.baseFare,
    distanceCharge: data.breakdown.distanceFare ?? data.baseFare,
    totalFare: data.totalFare,
  };
}