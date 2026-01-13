// import { ProviderType } from "@/shared/enums/provider.enum.js";
import { ProviderType } from "@prisma/client";
import { ExternalRideProvider } from "../contracts/external-provider.contract.js";

export class ProviderRegistry {
  private providers = new Map<ProviderType, ExternalRideProvider>();

  register(type: ProviderType, provider: ExternalRideProvider) {
    this.providers.set(type, provider);
  }

  get(type: ProviderType): ExternalRideProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Provider ${type} not registered`);
    }
    return provider;
  }
}
