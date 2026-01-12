import { startServer, stopServer, prisma, isServerRunning } from "./tests/utils.js";
import { seedData, cleanup } from "./tests/setup.js";
import { run as runAuth } from "./tests/1-auth.js";
import { run as runDriver } from "./tests/2-driver.js";
import { run as runTrips } from "./tests/3-trips.js";
import { run as runPayment } from "./tests/4-payment.js";
import { run as runMmt } from "./tests/5-mmt.js";
import { run as runRapido } from "./tests/6-rapido.js";

async function main() {
    console.log("🚀 Starting Project Test Suite");
    console.log("==========================================\n");

    let serverStarted = false;

    try {
        // 1. Check DB
        await prisma.$connect();
        console.log("🔌 Database connected");

        // 2. Start Server
        if (!(await isServerRunning())) {
            await startServer();
            serverStarted = true;
        } else {
            console.log("✅ Server already running");
        }

        // 3. Setup & Seed
        await cleanup();
        await seedData();

        // 4. Run Features
        await runAuth();
        await runDriver();
        await runTrips();
        await runPayment();

        // External Integrations (Optional if creds missing)
        await runMmt();
        await runRapido();

        console.log("\n==========================================");
        console.log("✅ ALL TESTS PASSED SUCCESSFULLY");
        console.log("==========================================\n");

    } catch (error: any) {
        console.error("\n❌ Test Suite Failed:", error.message);
        process.exit(1);
    } finally {
        if (serverStarted) {
            await stopServer();
        }
        await prisma.$disconnect();
    }
}

main();
