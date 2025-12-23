import { ProviderType } from "@/shared/enums/provider.enum.js";

export interface ExternalBooking {
  provider: ProviderType;
  externalBookingId: string;
  rawPayload?: Record<string, any>;
}
