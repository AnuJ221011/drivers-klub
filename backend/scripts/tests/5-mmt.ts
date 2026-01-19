import axios from "axios";
import { BASE_URL } from "./utils.js";

function getFutureDate(hours: number) {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    return d.toISOString();
}

/**
 * MMT V3 Full Integration Test
 * Covers: Search -> Block -> Confirm Paid -> Get Details -> Cancel -> Reschedule
 * Uses strict snake_case request/response formats.
 */
export async function run() {
    console.log("\n✈️  Testing MMT Integration (V3 Full Flow)...");

    const USERNAME = process.env.MMT_INBOUND_USERNAME;
    const PASSWORD = process.env.MMT_INBOUND_PASSWORD;

    if (!USERNAME || !PASSWORD) {
        console.warn("⚠️  Skipping MMT tests: Missing .env credentials (MMT_INBOUND_USERNAME/PASSWORD)");
        return;
    }

    const AUTH_HEADER = {
        headers: {
            'Authorization': `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64")}`
        }
    };

    let bookingId = "";
    const mmtRefId = `MMT_TEST_${Date.now()}`;

    // ---------------------------------------------------------
    // 1. Search (Search Fare)
    // ---------------------------------------------------------
    try {
        console.log("   -> 1. Testing Search...");
        const searchPayload = {
            start_time: getFutureDate(26),
            source: { city: "DELHI", latitude: 28.61, longitude: 77.20 },
            destination: { city: "GURGAON", latitude: 28.45, longitude: 77.02 },
            one_way_distance: 45,
            trip_type_details: { basic_trip_type: "AIRPORT", airport_type: "PICKUP" },
            partner_name: "MMT",
            search_id: `SEARCH_${Date.now()}`
        };

        const res = await axios.post(`${BASE_URL}/partners/mmt/partnersearchendpoint`, searchPayload, AUTH_HEADER);

        // Validation
        if (res.status === 200 && res.data.response && res.data.response.car_types) {
            const carTypes = res.data.response.car_types;
            if (carTypes.length > 0) {
                console.log(`      ✅ Search Passed. Found ${carTypes.length} car types.`);

                // Verify zero_payment flag if present
                const hasZeroPayment = carTypes.some((ct: any) => ct.zero_payment === true);
                if (hasZeroPayment) console.log("      ✅ Verified zero_payment: true flag.");
            } else {
                throw new Error("No car types returned in search");
            }
        } else {
            throw new Error(`Invalid Search Response structure: ${JSON.stringify(res.data)}`);
        }

    } catch (e: any) {
        console.error(`      ❌ Search Failed: ${e.message} - ${JSON.stringify(e.response?.data)}`);
        return; // Stop if search fails
    }

    // ---------------------------------------------------------
    // 2. Block (Block Ride)
    // ---------------------------------------------------------
    try {
        console.log("   -> 2. Testing Block...");
        const blockPayload = {
            sku_id: "TATA_TIGOR_EV",
            mmt_ref_id: mmtRefId,
            start_time: getFutureDate(26),
            source: { city: "DELHI", latitude: 28.61, longitude: 77.20 },
            destination: { city: "GURGAON", latitude: 28.45, longitude: 77.02 },
            one_way_distance: 45,
            trip_type_details: { basic_trip_type: "AIRPORT" },
            customer_name: "Test User",
            customer_mobile: "9999999999"
        };

        const res = await axios.post(`${BASE_URL}/partners/mmt/partnerblockendpoint`, blockPayload, AUTH_HEADER);

        if (res.data.response && res.data.response.order_reference_number) {
            bookingId = res.data.response.order_reference_number;
            const otp = res.data.response.verification_code;
            console.log(`      ✅ Block Passed. Booking ID: ${bookingId}, OTP: ${otp}`);
        } else {
            throw new Error(`Invalid Block Response: ${JSON.stringify(res.data)}`);
        }

    } catch (e: any) {
        console.error(`      ❌ Block Failed: ${e.message} - ${JSON.stringify(e.response?.data)}`);
        return; // Stop if block fails
    }

    // ---------------------------------------------------------
    // 3. Confirm Paid
    // ---------------------------------------------------------
    try {
        console.log(`   -> 3. Testing Confirm Paid (${bookingId})...`);
        const paidPayload = {
            order_reference_number: bookingId,
            partner_reference_number: mmtRefId,
            amount_to_be_collected: 1250
        };

        const res = await axios.post(`${BASE_URL}/partners/mmt/partnerpaidendpoint`, paidPayload, AUTH_HEADER);

        if (res.data.response && res.data.response.status === "CONFIRMED") {
            console.log("      ✅ Confirm Paid Passed.");
        } else {
            throw new Error(`Paid Failed or Status not CONFIRMED: ${JSON.stringify(res.data)}`);
        }

    } catch (e: any) {
        console.error(`      ❌ Confirm Paid Failed: ${e.message}`);
        // Continue to try Cancel/Details even if Paid fails (sometimes)
    }

    // ---------------------------------------------------------
    // 4. Get Booking Details
    // ---------------------------------------------------------
    try {
        console.log(`   -> 4. Testing Get Details (${bookingId})...`);
        const res = await axios.get(`${BASE_URL}/partners/mmt/booking/details`, {
            ...AUTH_HEADER,
            params: { booking_id: bookingId }
        });

        // Response format: { response: { booking_id: "...", status: "CONFIRMED", ... } }
        if (res.data.response && res.data.response.booking_id === bookingId) {
            console.log(`      ✅ Get Details Passed. Status: ${res.data.response.status}`);
        } else {
            throw new Error(`Invalid Details Response: ${JSON.stringify(res.data)}`);
        }

    } catch (e: any) {
        console.error(`      ❌ Get Details Failed: ${e.message}`);
    }

    // ---------------------------------------------------------
    // 5. Reschedule - Check & Confirm
    // ---------------------------------------------------------
    try {
        console.log("   -> 5. Testing Reschedule...");
        // Reschedule Block
        const reschedulePayload = {
            order_reference_number: bookingId,
            start_time: getFutureDate(30) // Move 4 hours later
        };
        const resCheck = await axios.post(`${BASE_URL}/partners/mmt/partnerrescheduleblockendpoint`, reschedulePayload, AUTH_HEADER);

        if (resCheck.data.response && resCheck.data.response.success) {
            console.log("      ✅ Reschedule Block Passed.");

            // Reschedule Confirm
            const resConfirm = await axios.post(`${BASE_URL}/partners/mmt/partnerrescheduleconfirmendpoint`, {
                order_reference_number: bookingId
            }, AUTH_HEADER);

            if (resConfirm.data.success) { // Note: Confirm usually returns { success: true } at root or inside response, check controller
                console.log("      ✅ Reschedule Confirm Passed.");
            } else {
                console.log(`      ⚠️ Reschedule Confirm Response: ${JSON.stringify(resConfirm.data)}`);
            }

        } else {
            throw new Error(`Reschedule Block Failed: ${JSON.stringify(resCheck.data)}`);
        }

    } catch (e: any) {
        console.error(`      ❌ Reschedule Failed: ${e.message} - ${JSON.stringify(e.response?.data)}`);
    }

    // ---------------------------------------------------------
    // 6. Cancel
    // ---------------------------------------------------------
    try {
        console.log(`   -> 6. Testing Cancel (${bookingId})...`);
        const cancelPayload = {
            order_reference_number: bookingId,
            cancelled_by: "Customer",
            cancellation_reason: "Test Script Cleanup"
        };

        const res = await axios.post(`${BASE_URL}/partners/mmt/partnercancelendpoint`, cancelPayload, AUTH_HEADER);

        if (res.data.response && res.data.response.success) {
            console.log("      ✅ Cancel Passed.");
        } else {
            throw new Error(`Cancel Failed: ${JSON.stringify(res.data)}`);
        }

    } catch (e: any) {
        console.error(`      ❌ Cancel Failed: ${e.message}`);
    }
}

if (process.argv[1] === import.meta.filename) {
    (async () => {
        try { await run(); } catch (e) { console.error(e); }
    })();
}
