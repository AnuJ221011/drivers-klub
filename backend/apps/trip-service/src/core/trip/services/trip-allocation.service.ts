// import { ProviderType } from "@/shared/enums/provider.enum.js";
import { Provider } from "@prisma/client";
type ProviderType = Provider;

export class TripAllocationService {
  decideProvider(_input: any): ProviderType {
    // v1 logic: Default to INTERNAL for Admin/Driver apps
    return Provider.INTERNAL;
  }
}
