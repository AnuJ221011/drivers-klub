import { prisma } from "@driversklub/database";
import { IdUtils, EntityType } from "@driversklub/common";
import { ProviderType } from "@prisma/client";

export class RideProviderMappingRepository {
    async create(input: {
        rideId: string;
        providerType: ProviderType;
        externalBookingId: string;
        providerStatus: string;
        rawPayload: any;
    }) {
        const shortId = await IdUtils.generateShortId(
            prisma,
            EntityType.RIDE_PROVIDER_MAPPING
        );
        return prisma.rideProviderMapping.create({
            data: {
                ...input,
                shortId,
            },
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
