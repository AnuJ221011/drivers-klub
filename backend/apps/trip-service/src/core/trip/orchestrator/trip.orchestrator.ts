import { TripAllocationService } from "../services/trip-allocation.service.js";


import { ProviderRegistry } from "./provider.registry.js";
import { RideProviderMappingRepository } from "../repositories/ride-provider-mapping.repo.js";
import { TripCreateService } from "../services/trip-create.service.js";

export class TripOrchestrator {
  constructor(
    private allocation: TripAllocationService,

    private registry: ProviderRegistry,
    private rideProviderMappingRepo: RideProviderMappingRepository
  ) { }

  async createTrip(input: any) {
    // 1. Decide provider
    const providerType = this.allocation.decideProvider(input);

    // 2. Create internal ride
    // Using TripCreateService which has the full logic (Validation, Pricing, DB)
    const ride = await TripCreateService.create(input);

    // 3. Delegate to provider
    // Defer both MMT and MojoBoxx for manual assignment flow (Safety First)
    if (providerType === "MMT" || providerType === "MOJOBOXX") {
      // Persist the intent so Assignment Service knows which provider to trigger
      await this.rideProviderMappingRepo.create({
        rideId: ride.id,
        providerType,
        externalBookingId: "", // Not yet booked
        providerStatus: "PENDING", // Deferred status
        rawPayload: {},
      });
      return ride;
    }

    const provider = this.registry.get(providerType);

    if (!provider) throw new Error(`Provider not found for type: ${providerType}`);

    const booking = await provider.prebook(input);

    // 4. Persist Mapping
    await this.rideProviderMappingRepo.create({
      rideId: ride.id,
      providerType,
      externalBookingId: booking.externalBookingId,
      providerStatus: "PREBOOKED",
      rawPayload: booking.rawPayload,
    });

    return ride;
  }
}
