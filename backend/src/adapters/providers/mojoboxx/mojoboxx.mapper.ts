import { FareOption } from "../../../core/trip/contracts/fare.contract.js";
import { ProviderType } from "../../../shared/enums/provider.enum.js";

export function mapFareResponse(res: any): FareOption[] {
    return res.data.map((item: any) => ({
        provider: ProviderType.MOJOBOXX,
        vehicleType: item.vehicleType,
        capacity: item.seats,
        fare: item.fare,
        currency: "INR",
        metadata: {
            fareId: item.fareId,
            cabPartner: item.cabPartner,
            expiryTime: item.expiryTime,
        },
    }));
}
