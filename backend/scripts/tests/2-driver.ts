import { apiCall, globalContext, prisma } from "./utils.js";
import { DRIVER_PHONE, FLEET_NAME } from "./setup.js";

export async function run() {
    console.log("\n👨‍✈️ Testing Driver Management...");

    if (!globalContext.adminToken) throw new Error("Missing adminToken. Run Auth test first.");

    // Fetch driver ID if not already known (from Setup or previous run)
    if (!globalContext.driverId) {
        const driverUser = await prisma.user.findUnique({
            where: { phone: DRIVER_PHONE },
            include: { driver: true }
        });
        if (driverUser?.driver) globalContext.driverId = driverUser.driver.id;
        else throw new Error("Driver not found in DB");
    }

    // 1. Fetch Fleet to get ID
    const fleet = await prisma.fleet.findFirst({ where: { name: FLEET_NAME } });
    if (!fleet) throw new Error("Fleet not found");
    globalContext.fleetId = fleet.id;

    // 2. Get Driver Profile (Admin)
    const profileRes = await apiCall("GET", `/drivers/${globalContext.driverId}`, null, globalContext.adminToken);

    if (profileRes.success) {
        console.log(`✅ Fetched Profile: ${profileRes.data.data.firstName}`);
    } else {
        console.error(`❌ Failed to fetch profile: ${profileRes.error}`);
    }

    // 3. Update Preferences (Mock)
    // Add implementation if preference endpoints exist and are critical
}

if (process.argv[1] === import.meta.filename) {
    (async () => {
        try { await run(); } catch (e) { console.error(e); }
    })();
}
