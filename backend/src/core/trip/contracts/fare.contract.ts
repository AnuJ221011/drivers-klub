import { ProviderType } from "@/shared/enums/provider.enum.js";

export interface FareOption {
  provider: ProviderType;
  vehicleType: string;
  capacity: number;
  fare: number;
  currency: string;
  metadata?: Record<string, any>;
}
