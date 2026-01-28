import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from 'dotenv';

dotenv.config();

// Replicating connection logic from packages/database/src/index.ts
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false } // Force SSL for remote DB
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Re-declare local types relative to the script
enum EntityType {
    USER = "USR",
    DRIVER = "DRV",
    HUB_MANAGER = "MGR",
    FLEET = "FLT",
    VEHICLE = "VEH",
    HUB = "HUB",
    TRIP = "TRP",
    BOOKING = "BKS",
    ATTENDANCE = "ATT",
    TRANSACTION = "TXN",
    PAYOUT = "PAY",
    INCENTIVE = "INC",
    PENALTY = "PEN",
    RENTAL_PLAN = "PLN",
    COLLECTION = "COL",
    REFERRAL = "REF",
    ASSIGNMENT = "ASN",
    DRIVER_RENTAL = "RTL",
    RIDE_PROVIDER_MAPPING = "RPM",
    PREFERENCE_DEFINITION = "PFD",
    DRIVER_PREFERENCE_REQUEST = "DPR",
    DRIVER_PREFERENCE = "DPF",
    VIRTUAL_QR = "VQR",
    RENTAL_PAYMENT = "RTP",
    TRIP_ASSIGNMENT = "TAS",
    BREAK = "BRK",
}

class IdUtils {
    static async generateShortId(
        prisma: any,
        entity: EntityType,
        dateOverride?: Date
    ): Promise<string> {
        // console.log('Generating ID for', entity);
        const now = dateOverride || new Date();
        const dateStr = now.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

        try {
            if (!prisma.idSequence) {
                throw new Error('prisma.idSequence is undefined!');
            }
            const sequence = await (prisma as PrismaClient).idSequence.upsert({
                where: {
                    entity_date: {
                        entity: entity,
                        date: dateStr,
                    },
                },
                update: {
                    lastValue: {
                        increment: 1,
                    },
                },
                create: {
                    entity: entity,
                    date: dateStr,
                    lastValue: 1,
                },
            });
            const serialStr = sequence.lastValue.toString().padStart(3, "0");
            return `${entity}${dateStr}${serialStr}`;
        } catch (e) {
            console.error('Error in generateShortId:', e);
            throw e;
        }
    }
}

async function backfill(entity: EntityType, modelName: string, prefix: string) {
    console.log(`Backfilling ${modelName}...`);
    try {
        const model = (prisma as any)[modelName];
        if (!model) {
            console.log(`Model ${modelName} not found!`);
            return;
        }

        console.log(`Querying ${modelName} for missing shortIds...`);
        let records;
        const noCreatedAtModels = ['preferenceDefination', 'fleetHub', 'driverPreferenceRequest', 'break'];

        if (noCreatedAtModels.includes(modelName)) {
            console.log(`Special handling for ${modelName} (no createdAt sort)`);
            records = await model.findMany({
                where: { shortId: null }
            });
        } else {
            records = await model.findMany({
                where: { shortId: null },
                orderBy: { createdAt: 'asc' }
            });
        }

        console.log(`Found ${records.length} records to update for ${modelName}`);

        for (const record of records) {
            try {
                const createdAt = (record as any).createdAt ? new Date((record as any).createdAt) :
                    (record as any).requestAt ? new Date((record as any).requestAt) :
                        (record as any).startTime ? new Date((record as any).startTime) :
                            new Date();
                const shortId = await IdUtils.generateShortId(prisma, entity, createdAt);
                await model.update({
                    where: { id: record.id },
                    data: { shortId }
                });
                console.log(`Updated ${modelName} ${record.id} -> ${shortId}`);
            } catch (err: any) {
                console.error(`\nFailed to update ${modelName} ${record.id}:`, err?.message || err);
                // Optional: stop or continue. Let's continue to see other errors
            }
        }
        console.log(`\nDone ${modelName}.\n`);
    } catch (err: any) {
        console.error(`FATAL ERROR processing ${modelName}:`, err);
    }
}

async function main() {
    console.log('Starting Backfill Process...');

    // People
    await backfill(EntityType.USER, 'user', 'USR');
    await backfill(EntityType.DRIVER, 'driver', 'DRV');
    await backfill(EntityType.HUB_MANAGER, 'hubManager', 'MGR');
    await backfill(EntityType.FLEET, 'fleet', 'FLT');
    await backfill(EntityType.VEHICLE, 'vehicle', 'VEH');
    await backfill(EntityType.HUB, 'fleetHub', 'HUB');
    await backfill(EntityType.TRIP, 'ride', 'TRP');
    await backfill(EntityType.BOOKING, 'paymentOrder', 'BKS');
    await backfill(EntityType.ATTENDANCE, 'attendance', 'ATT');
    await backfill(EntityType.TRANSACTION, 'transaction', 'TXN');
    await backfill(EntityType.PAYOUT, 'payout', 'PAY');
    await backfill(EntityType.INCENTIVE, 'incentive', 'INC');
    await backfill(EntityType.PENALTY, 'penalty', 'PEN');
    await backfill(EntityType.RENTAL_PLAN, 'rentalPlan', 'PLN');
    await backfill(EntityType.COLLECTION, 'dailyCollection', 'COL');
    await backfill(EntityType.REFERRAL, 'referral', 'REF');
    await backfill(EntityType.ASSIGNMENT, 'assignment', 'ASN');
    await backfill(EntityType.DRIVER_RENTAL, 'driverRental', 'RTL');
    await backfill(EntityType.RIDE_PROVIDER_MAPPING, 'rideProviderMapping', 'RPM');

    // Focus on missing ones
    await backfill(EntityType.PREFERENCE_DEFINITION, 'preferenceDefination', 'PFD');
    await backfill(EntityType.DRIVER_PREFERENCE_REQUEST, 'driverPreferenceRequest', 'DPR');
    await backfill(EntityType.DRIVER_PREFERENCE, 'driverPreference', 'DPF');
    await backfill(EntityType.VIRTUAL_QR, 'virtualQR', 'VQR');
    await backfill(EntityType.RENTAL_PAYMENT, 'rentalPayment', 'RTP');
    await backfill(EntityType.TRIP_ASSIGNMENT, 'tripAssignment', 'TAS');
    await backfill(EntityType.BREAK, 'break', 'BRK');

    console.log('Backfill Completed Successfully.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
