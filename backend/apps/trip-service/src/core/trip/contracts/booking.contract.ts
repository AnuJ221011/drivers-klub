// import { ProviderType } from "@/shared/enums/provider.enum.js";
import { Provider } from "@prisma/client";
type ProviderType = Provider;

export interface ExternalBooking {
  provider: ProviderType;
  externalBookingId: string;
  rawPayload?: Record<string, any>;
}
