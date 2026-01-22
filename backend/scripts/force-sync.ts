
import { BigQuery } from '@google-cloud/bigquery';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load env vars from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, AWS_S3_BUCKET_NAME } = process.env;

// Simple logger mock since we can't easily import common
const logger = {
    info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
    warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
};

class ForceAnalyticsService {
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
                logger.warn("[Analytics] No GCP credentials found. Sync disabled.");
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

    // MODIFIED: Always return Epoch 0 to force full sync
    private static async getLastSyncTime(bq: BigQuery, table: string): Promise<Date> {
        logger.warn(`[ForceSync] Forcing full sync for table: ${table}. Returning Epoch 0.`);
        return new Date(0);
    }

    private static async ensureTables(bq: BigQuery) {
        const dataset = bq.dataset(this.datasetId);

        // 1. fact_rides
        const ridesTable = dataset.table('fact_rides');
        const [ridesExists] = await ridesTable.exists();
        if (!ridesExists) {
            logger.info("Table fact_rides missing, it will be created implicitly or logic should be here.");
            // omitting create logic for brevity as user says tables exist but are empty
        }
    }

    public static async runSync() {
        const bq = await this.getBigQueryClient();
        if (!bq) return;
        const pg = await this.getPgClient();
        if (!pg) return;

        logger.info("[Analytics] Starting FORCE ETL Sync...");

        try {
            await this.syncRides(pg, bq);
            await this.syncDrivers(pg, bq);

            logger.info("[Analytics] Force Sync Completed.");
            process.exit(0);
        } catch (error) {
            logger.error("[Analytics] Sync Failed:", error);
            process.exit(1);
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

        if (res.rows.length === 0) {
            logger.info("No rides found to sync.");
            return;
        }

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

        if (res.rows.length === 0) {
            logger.info("No drivers found to sync.");
            return;
        }

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

ForceAnalyticsService.runSync();
