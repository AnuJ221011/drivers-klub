import { prisma } from "../../../utils/prisma.js";
import { ProviderType } from "../../../shared/enums/provider.enum.js";

export class RideProviderMappingRepository {
    async create(input: {
        rideId: string;
        providerType: ProviderType;
        externalBookingId: string;
        providerStatus: string;
        rawPayload: any;
    }) {
        return prisma.rideProviderMapping.create({
            data: input,
        });
    }

    async findByRideId(rideId: string) {
        return prisma.rideProviderMapping.findUnique({
            where: { rideId },
        });
    }

    async updateStatus(
        rideId: string,
        providerStatus: string,
        rawPayload?: any
    ) {
        return prisma.rideProviderMapping.update({
            where: { rideId },
            data: {
                providerStatus,
                ...(rawPayload && { rawPayload }),
            },
        });
    }
}
