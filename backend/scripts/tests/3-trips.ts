import { apiCall, globalContext } from "./utils.js";

export async function run() {
    console.log("\n🚗 Testing Trip Lifecycle...");

    if (!globalContext.adminToken) throw new Error("Missing adminToken");
    if (!globalContext.driverId) throw new Error("Missing driverId");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const tripData = {
        tripType: "AIRPORT",
        originCity: "GURGAON",
        destinationCity: "DELHI",
        pickupLocation: "Cyber City, Gurgaon",
        dropLocation: "IGI Airport, Delhi",
        tripDate: tomorrow.toISOString(),
        bookingDate: new Date().toISOString(),
        distanceKm: 25,
        vehicleSku: "TATA_TIGOR_EV"
    };

    // 1. Create Trip
    const createRes = await apiCall("POST", "/trips", tripData, globalContext.adminToken);

    if (createRes.success) {
        globalContext.tripId = createRes.data.data.id;
        console.log(`✅ Trip Created: ${globalContext.tripId}`);
    } else {
        console.error(`❌ Trip Creation Failed: ${createRes.error}`);
        throw new Error("Trip creation failed");
    }

    // 2. Assign Driver
    const assignRes = await apiCall("POST", "/admin/trips/assign", {
        tripId: globalContext.tripId,
        driverId: globalContext.driverId
    }, globalContext.adminToken);

    if (assignRes.success) {
        console.log("✅ Driver Assigned");
    } else {
        console.error(`❌ Assignment Failed: ${assignRes.error}`);
    }
}

if (process.argv[1] === import.meta.filename) {
    (async () => {
        try { await run(); } catch (e) { console.error(e); }
    })();
}
