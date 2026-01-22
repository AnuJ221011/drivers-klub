import { BigQuery } from '@google-cloud/bigquery';
import { prisma } from "@driversklub/database";
import { logger } from "@driversklub/common";
import { Client } from 'pg';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, AWS_S3_BUCKET_NAME } = process.env;

export class AnalyticsService {
    private static bq: BigQuery | null = null;
    private static datasetId = 'analytics';
    private static projectId = process.env.GCP_PROJECT_ID;
    private static pgClient: Client | null = null;

    private static async fetchCredentialsFromS3(s3Path: string): Promise<any> {
        try {
            const s3 = new S3Client({
                region: AWS_DEFAULT_REGION || 'ap-south-1',
                credentials: {
                    accessKeyId: AWS_ACCESS_KEY_ID || '',
                    secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
                }
            });

            const bucket = AWS_S3_BUCKET_NAME || 'driversklub-assets';
            logger.info(`[Analytics] Fetching credentials from S3: s3://${bucket}/${s3Path}`);

            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: s3Path
            });

            const response = await s3.send(command);
            const str = await response.Body?.transformToString();

            if (!str) throw new Error("Empty body from S3");
            return JSON.parse(str);
        } catch (error) {
            logger.error("[Analytics] Failed to fetch key from S3:", error);
            return null;
        }
    }

    private static async getBigQueryClient(): Promise<BigQuery | null> {
        if (this.bq) return this.bq;

        let credentials;
        try {
            if (process.env.GCP_KEY_S3_PATH) {
                // Option 1 (Best): Fetch from S3 (Bypass size limits)
                credentials = await this.fetchCredentialsFromS3(process.env.GCP_KEY_S3_PATH);
            }

            if (!credentials && process.env.GCP_SERVICE_ACCOUNT) {
                // Option 2: Raw JSON Env Var
                credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT);
            }

            if (!credentials && process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64) {
                // Option 3: Base64 Env Var
                const jsonString = Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
                credentials = JSON.parse(jsonString);
            }

            if (!credentials) {
                logger.warn("[Analytics] No GCP credentials found (S3_PATH, SERVICE_ACCOUNT, or BASE64). Sync disabled.");
                return null;
            }

            this.bq = new BigQuery({
                projectId: this.projectId,
                credentials,
            });
            return this.bq;
        } catch (error) {
            logger.error("[Analytics] Failed to initialize BigQuery client:", error);
            return null;
        }
    }

    private static async getPgClient(): Promise<Client | null> {
        if (this.pgClient) return this.pgClient;
        let connectionString = process.env.ANALYTICS_DATABASE_URL || process.env.DATABASE_URL;

        if (!connectionString) {
            logger.error("[Analytics] No database connection string available.");
            return null;
        }

        // Warn if using main DB URL implicitly
        if (!process.env.ANALYTICS_DATABASE_URL && process.env.DATABASE_URL) {
            logger.warn("[Analytics] ANALYTICS_DATABASE_URL not set. Using main DATABASE_URL.");
        }

        try {
            const client = new Client({
                connectionString,
                ssl: { rejectUnauthorized: false }
            });
            await client.connect();
            this.pgClient = client;
            return client;
        } catch (error) {
            logger.error("[Analytics] Failed to connect to Postgres:", error);
            return null;
        }
    }

    private static async getLastSyncTime(bq: BigQuery, table: string): Promise<Date> {
        const query = `SELECT MAX(updated_at) as last_sync FROM \`${this.projectId}.${this.datasetId}.${table}\``;
        try {
            const [job] = await bq.createQueryJob({ query });
            const [rows] = await job.getQueryResults();
            if (rows && rows.length > 0 && rows[0].last_sync && rows[0].last_sync.value) {
                return new Date(rows[0].last_sync.value);
            }
        } catch (e: any) {
            // Ignore if table not found
        }
        return new Date(0); // Epoch
    }

    private static async ensureTables(bq: BigQuery) {
        const dataset = bq.dataset(this.datasetId);

        // 1. fact_rides
        const ridesTable = dataset.table('fact_rides');
        const [ridesExists] = await ridesTable.exists();
        if (!ridesExists) {
            await ridesTable.create({
                schema: [
                    { name: 'trip_id', type: 'STRING' },
                    { name: 'trip_type', type: 'STRING' },
                    { name: 'status', type: 'STRING' },
                    { name: 'driver_id', type: 'STRING' },
                    { name: 'vehicle_sku', type: 'STRING' },
                    { name: 'origin_city', type: 'STRING' },
                    { name: 'destination_city', type: 'STRING' },
                    { name: 'pickup_lat', type: 'FLOAT' },
                    { name: 'pickup_lng', type: 'FLOAT' },
                    { name: 'drop_lat', type: 'FLOAT' },
                    { name: 'drop_lng', type: 'FLOAT' },
                    { name: 'distance_km', type: 'FLOAT' },
                    { name: 'billable_km', type: 'INTEGER' },
                    { name: 'rate_per_km', type: 'INTEGER' },
                    { name: 'total_fare', type: 'FLOAT' },
                    { name: 'created_at', type: 'TIMESTAMP' },
                    { name: 'scheduled_pickup_time', type: 'TIMESTAMP' },
                    { name: 'started_at', type: 'TIMESTAMP' },
                    { name: 'completed_at', type: 'TIMESTAMP' },
                    { name: 'provider_name', type: 'STRING' },
                    { name: 'provider_booking_id', type: 'STRING' },
                    { name: 'provider_status', type: 'STRING' },
                    { name: 'updated_at', type: 'TIMESTAMP' }
                ],
                timePartitioning: { type: 'DAY', field: 'created_at' }
            });
            logger.info("[Analytics] Created table: fact_rides");
        }

        // 2. dim_drivers
        const driversTable = dataset.table('dim_drivers');
        const [driversExists] = await driversTable.exists();
        if (!driversExists) {
            await driversTable.create({
                schema: [
                    { name: 'driver_id', type: 'STRING' },
                    { name: 'user_id', type: 'STRING' },
                    { name: 'fleet_id', type: 'STRING' },
                    { name: 'full_name', type: 'STRING' },
                    { name: 'mobile', type: 'STRING' },
                    { name: 'city', type: 'STRING' },
                    { name: 'current_status', type: 'STRING' },
                    { name: 'kyc_status', type: 'STRING' },
                    { name: 'is_available', type: 'BOOLEAN' },
                    { name: 'current_vehicle_id', type: 'STRING' },
                    { name: 'payment_model', type: 'STRING' },
                    { name: 'deposit_balance', type: 'FLOAT' },
                    { name: 'rev_share_percentage', type: 'FLOAT' },
                    { name: 'joined_at', type: 'TIMESTAMP' },
                    { name: 'updated_at', type: 'TIMESTAMP' }
                ]
            });
            logger.info("[Analytics] Created table: dim_drivers");
        }
    }

    public static async runSync() {
        const bq = await this.getBigQueryClient();
        if (!bq) return;
        const pg = await this.getPgClient();
        if (!pg) return;

        logger.info("[Analytics] Starting ETL Sync (Full Schema)...");

        try {
            await bq.dataset(this.datasetId).get({ autoCreate: true });
            await this.ensureTables(bq);

            await this.syncRides(pg, bq);
            await this.syncDrivers(pg, bq);

            logger.info("[Analytics] ETL Sync Completed.");
        } catch (error) {
            logger.error("[Analytics] ETL Sync Failed:", error);
        }
    }

    private static async syncRides(pg: Client, bq: BigQuery) {
        const tableId = 'fact_rides';
        const lastSync = await this.getLastSyncTime(bq, tableId);

        const res = await pg.query(
            `SELECT 
                r.id as trip_id, 
                r."tripType" as trip_type,
                r.status, 
                (SELECT "driverId" FROM "TripAssignment" ta WHERE ta."tripId" = r.id ORDER BY ta."createdAt" DESC LIMIT 1) as driver_id, 
                r."vehicleSku" as vehicle_sku,
                r."originCity" as origin_city,
                r."destinationCity" as destination_city,
                r."pickupLat" as pickup_lat,
                r."pickupLng" as pickup_lng,
                r."dropLat" as drop_lat,
                r."dropLng" as drop_lng,
                r."distanceKm" as distance_km, 
                r."billableKm" as billable_km,
                r."ratePerKm" as rate_per_km,
                r."totalFare" as total_fare, 
                r."createdAt" as created_at, 
                r."tripDate" as scheduled_pickup_time,
                r."startedAt" as started_at,
                r."completedAt" as completed_at, 
                r.provider as provider_name,
                r."providerBookingId" as provider_booking_id,
                r."providerStatus" as provider_status,
                r."updatedAt" as updated_at
             FROM "Ride" r
             WHERE r."updatedAt" > $1 
             ORDER BY r."updatedAt" ASC 
             LIMIT 2000`,
            [lastSync]
        );

        if (res.rows.length === 0) return;

        const rows = res.rows.map(r => ({
            trip_id: r.trip_id,
            trip_type: r.trip_type,
            status: r.status,
            driver_id: r.driver_id,
            vehicle_sku: r.vehicle_sku,
            origin_city: r.origin_city,
            destination_city: r.destination_city,
            pickup_lat: parseFloat(r.pickup_lat || 0),
            pickup_lng: parseFloat(r.pickup_lng || 0),
            drop_lat: parseFloat(r.drop_lat || 0),
            drop_lng: parseFloat(r.drop_lng || 0),
            distance_km: parseFloat(r.distance_km || 0),
            billable_km: parseInt(r.billable_km || 0),
            rate_per_km: parseInt(r.rate_per_km || 0),
            total_fare: parseFloat(r.total_fare || 0),
            created_at: r.created_at ? bq.timestamp(r.created_at) : null,
            scheduled_pickup_time: r.scheduled_pickup_time ? bq.timestamp(r.scheduled_pickup_time) : null,
            started_at: r.started_at ? bq.timestamp(r.started_at) : null,
            completed_at: r.completed_at ? bq.timestamp(r.completed_at) : null,
            provider_name: r.provider_name || 'INTERNAL',
            provider_booking_id: r.provider_booking_id,
            provider_status: r.provider_status,
            updated_at: bq.timestamp(r.updated_at)
        }));

        await bq.dataset(this.datasetId).table(tableId).insert(rows);
        logger.info(`[Analytics] Inserted ${rows.length} rides.`);
    }

    private static async syncDrivers(pg: Client, bq: BigQuery) {
        const tableId = 'dim_drivers';
        const lastSync = await this.getLastSyncTime(bq, tableId);

        const res = await pg.query(
            `SELECT 
                d.id as driver_id, 
                d."userId" as user_id,
                d."fleetId" as fleet_id,
                CONCAT(d."firstName", ' ', d."lastName") as full_name,
                d.mobile,
                d.city,
                d.status as current_status,
                d."kycStatus" as kyc_status,
                d."isAvailable" as is_available,
                d."vehicleId" as current_vehicle_id,
                d."paymentModel" as payment_model,
                d."depositBalance" as deposit_balance,
                d."revSharePercentage" as rev_share_percentage,
                d."createdAt" as joined_at,
                d."updatedAt" as updated_at
             FROM "Driver" d
             WHERE d."updatedAt" > $1
             ORDER BY d."updatedAt" ASC
             LIMIT 2000`,
            [lastSync]
        );

        if (res.rows.length === 0) return;

        const rows = res.rows.map(r => ({
            driver_id: r.driver_id,
            user_id: r.user_id,
            fleet_id: r.fleet_id,
            full_name: r.full_name,
            mobile: r.mobile,
            city: r.city,
            current_status: r.current_status,
            kyc_status: r.kyc_status,
            is_available: !!r.is_available,
            current_vehicle_id: r.current_vehicle_id,
            payment_model: r.payment_model,
            deposit_balance: parseFloat(r.deposit_balance || 0),
            rev_share_percentage: parseFloat(r.rev_share_percentage || 0),
            joined_at: r.joined_at ? bq.timestamp(r.joined_at) : null,
            updated_at: bq.timestamp(r.updated_at)
        }));

        await bq.dataset(this.datasetId).table(tableId).insert(rows);
        logger.info(`[Analytics] Inserted ${rows.length} drivers.`);
    }
}
