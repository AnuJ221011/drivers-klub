// import { ProviderType } from "@/shared/enums/provider.enum.js";
import { Provider } from "@prisma/client";
type ProviderType = Provider;

export interface FareOption {
  provider: ProviderType;
  vehicleType: string;
  capacity: number;
  fare: number;
  currency: string;
  metadata?: Record<string, any>;
}
