
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const logger = {
    info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
};

async function checkDb() {
    let connectionString = process.env.ANALYTICS_DATABASE_URL || process.env.DATABASE_URL;
    logger.info(`Connecting to DB...`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        logger.info("Connected.");

        // 1. Check current user and database
        const userRes = await client.query('SELECT current_user, current_database()');
        logger.info("Current session:", userRes.rows[0]);

        // 2. List tables
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        logger.info("Tables in public schema:", tablesRes.rows.map(r => r.table_name));

        // 3. Count rows in Ride
        try {
            const countRide = await client.query('SELECT COUNT(*) FROM "Ride"');
            logger.info("Row count in 'Ride' table:", countRide.rows[0].count);
        } catch (e: any) {
            logger.error("Failed to count Ride:", e.message);
        }

        // 4. Count rows in Driver
        try {
            const countDriver = await client.query('SELECT COUNT(*) FROM "Driver"');
            logger.info("Row count in 'Driver' table:", countDriver.rows[0].count);
        } catch (e: any) {
            logger.error("Failed to count Driver:", e.message);
        }

        // 5. Count rows in User
        try {
            const countUser = await client.query('SELECT COUNT(*) FROM "User"');
            logger.info("Row count in 'User' table:", countUser.rows[0].count);
        } catch (e: any) {
            logger.error("Failed to count User:", e.message);
        }

    } catch (error) {
        logger.error("DB Connection/Query Error:", error);
    } finally {
        await client.end();
    }
}

checkDb();
