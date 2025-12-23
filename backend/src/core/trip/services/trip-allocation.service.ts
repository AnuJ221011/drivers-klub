import { ProviderType } from "@/shared/enums/provider.enum.js";

export class TripAllocationService {
  decideProvider(_input: any): ProviderType {
    // v1 logic (simple, replaceable)
    return ProviderType.MOJOBOXX;
  }
}
