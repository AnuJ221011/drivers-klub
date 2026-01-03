import axios from './axios';

type PricingPreviewResponse = {
  success: boolean;
  data: {
    baseFare: number;
    distanceCharge: number;
    totalFare: number;
    breakdown: {
      minBillableKm: number;
      ratePerKm: number;
    };
  };
};

export async function previewPricing(payload: {
  distanceKm: number;
  tripType: string;
}): Promise<PricingPreviewResponse['data']> {
  const res = await axios.post<PricingPreviewResponse>(
    '/pricing/preview',
    payload
  );

  return res.data.data;
}
