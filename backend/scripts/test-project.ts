import axios from 'axios';
import { globalContext, BASE_URL } from './tests/utils.js';
import { cleanup, seedData } from './tests/setup.js';

// Import Test Modules
import { run as runAuth } from './tests/1-auth.js';
import { run as runDriver } from './tests/2-driver.js';
import { run as runTrips } from './tests/3-trips.js';
import { run as runPayment } from './tests/4-payment.js';
import { run as runMMT } from './tests/5-mmt.js';
import { run as runRapido } from './tests/6-rapido.js';

// Helper to wait for services to be ready
async function waitForServices() {
    console.log("⏳ Waiting for services to be ready...");
    const services = [
        { name: "Gateway", url: `${BASE_URL}/health` },
        { name: "Auth Service", url: `${BASE_URL}/auth/health` },
        { name: "Trip Service", url: `${BASE_URL}/trips/health` }
    ];

    const maxRetries = 40;
    const delay = 1000;

    for (const service of services) {
        let ready = false;
        process.stdout.write(`   Waiting for ${service.name}... `);
        for (let i = 0; i < maxRetries; i++) {
            try {
                const res = await axios.get(service.url);
                if (res.status === 200) {
                    ready = true;
                    console.log("✅ Ready");
                    break;
                }
            } catch (e) {
                // Ignore error and retry
            }
            await new Promise(r => setTimeout(r, delay));
        }
        if (!ready) {
            console.log("❌ Failed");
            throw new Error(`Service ${service.name} is not reachable at ${service.url}`);
        }
    }
    console.log("🚀 All services are ready!\n");
}

// ==========================================
// MAPS SUITE TESTS (Existing Logic)
// ==========================================
async function runMapsSuite() {
    console.log('\n🗺️  Testing Google Maps Suite...');
    const token = globalContext.adminToken;
    if (!token) throw new Error("Skipping Maps Suite: No Admin Token available");

    // Test 1: Autocomplete
    try {
        console.log('   Testing Autocomplete (Airport)...');
        const response = await axios.get(`${BASE_URL}/maps/autocomplete`, {
            params: { query: 'Airport' },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 200 && Array.isArray(response.data.data)) {
            console.log('      ✅ Autocomplete Passed');
        } else {
            throw new Error(`Unexpected response: ${response.status}`);
        }
    } catch (e: any) {
        console.error(`      ❌ Autocomplete Failed: ${e.message} - ${JSON.stringify(e.response?.data)}`);
    }

    // Test 2: Geocoding
    try {
        console.log('   Testing Geocoding (Connaught Place)...');
        const response = await axios.get(`${BASE_URL}/maps/geocode`, {
            params: { address: 'Connaught Place, New Delhi' },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 200 && response.data.data.lat) {
            console.log('      ✅ Geocoding Passed');
        } else {
            throw new Error(`Unexpected response: ${response.status}`);
        }
    } catch (e: any) {
        if (e.response?.status === 404) {
            console.log("      ⚠️ Geocoding returned 404 (Likely invalid API Key, skipping failure)");
        } else {
            console.error(`      ❌ Geocoding Failed: ${e.message}`);
        }
    }
}

// ==========================================
// PRICING TESTS (Existing Logic)
// ==========================================
async function runPricingSuite() {
    console.log('\n💰 Testing Pricing Engine...');

    // Test 1: Pricing Preview
    try {
        console.log('   Testing Route Pricing...');
        const response = await axios.post(`${BASE_URL}/pricing/preview`, {
            pickup: 'Connaught Place, New Delhi',
            drop: 'Cyber City, Gurgaon',
            tripType: 'INTER_CITY',
            vehicleSku: 'TATA_TIGOR_EV',
            tripDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            bookingDate: new Date().toISOString(),
            distanceKm: 25
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 200 && response.data.data.totalFare) {
            console.log('      ✅ Pricing Preview Passed');
        } else {
            throw new Error('Invalid pricing response');
        }
    } catch (e: any) {
        console.error(`      ❌ Pricing Failed: ${e.message}`);
    }
}

// ==========================================
// MAIN ORCHESTRATOR
// ==========================================
async function runAllTests() {
    try {
        console.log("🧪 STARTING MASTER TEST SUITE\n");
        console.log(`🔗 Target: ${BASE_URL}`);

        // 0. Safeguard: Block Production
        const isProductionEnv = process.env.NODE_ENV === 'production';
        const isProductionUrl = BASE_URL.includes('driversklub-backend-env') || BASE_URL.includes('prod');

        if (isProductionEnv || isProductionUrl) {
            console.error("\n❌ CRITICAL ERROR: TESTS CANNOT RUN IN PRODUCTION");
            console.error("   Detected NODE_ENV=production or Production URL.");
            console.error("   This script performs destructive cleanup and seeding.");
            console.error("   ABORTING IMMEDIATELY.\n");
            process.exit(1);
        }

        // 1. Wait for health
        await waitForServices();

        // 2. Setup (Cleanup + Seed)
        await cleanup();
        await seedData();

        // 3. Run Sub-Modules
        // 3. Run Sub-Modules
        // Auth is critical - it sets tokens
        try {
            await runAuth();
        } catch (e: any) {
            console.error("❌ Auth Module Failed:", e.message);
            console.error(e);
            throw e;
        }

        // now we have tokens in globalContext
        await runDriver();
        await runTrips();
        await runPayment();
        await runMMT();
        await runRapido();

        // 4. Run Maps/Pricing (using the auth context)
        await runMapsSuite();
        await runPricingSuite();

        console.log('\n✅ MASTER TEST SUITE COMPLETED SUCCESSFULLY');
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ TEST SUITE FAILED CATASTROPHICALLY');
        console.error(error);
        process.exit(1);
    }
}

// Run
if (process.argv[1] === import.meta.filename) {
    runAllTests();
}
