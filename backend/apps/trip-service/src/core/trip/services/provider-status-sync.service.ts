import { RideProviderMappingRepository } from "../repositories/ride-provider-mapping.repo.js";
import { RideService } from "../services/ride.service.js";
import { ProviderRegistry } from "../orchestrator/provider.registry.js";
import { mapProviderStatusToRideStatus } from "../mappers/provider-status.mapper.js";

export class ProviderStatusSyncService {
    constructor(
        private mappingRepo: RideProviderMappingRepository,
        private rideService: RideService,
        private registry: ProviderRegistry
    ) { }

    async syncRide(rideId: string) {
        const mapping = await this.mappingRepo.findByRideId(rideId);
        if (!mapping) return;

        const provider = this.registry.get(mapping.providerType);

        const providerResponse = await provider.getBookingDetails({
            bookingId: mapping.externalBookingId,
        });

        // Handle array or single object response depending on provider
        const providerStatus =
            providerResponse?.data?.[0]?.status || providerResponse?.data?.status || "UNKNOWN";

        const newRideStatus = mapProviderStatusToRideStatus(
            mapping.providerType,
            providerStatus
        );

        await this.mappingRepo.updateStatus(
            rideId,
            providerStatus,
            providerResponse
        );

        await this.rideService.updateStatus(rideId, newRideStatus);
    }
}
