import { FareOption } from "@/core/trip/contracts/fare.contract.js";
import { ProviderType } from "@/shared/enums/provider.enum.js";

export function mapMMTFareResponse(data: any): FareOption[] {
    // Transform external MMT format to internal FareOption
    if (!data || !data.rates) return [];

    return data.rates.map((rate: any) => ({
        provider: ProviderType.MMT, // Ensure MMT is in ProviderType enum (might need update)
        vehicleType: rate.category,
        price: rate.amount,
        currency: "INR",
        estimatedTimeMs: 1000 * 60 * 60, // Mock
        providerMeta: {
            fareId: rate.id
        }
    }));
}
