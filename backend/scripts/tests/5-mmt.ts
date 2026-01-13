import axios from "axios";
import { BASE_URL } from "./utils.js";

function getFutureDate(hours: number) {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    return d.toISOString();
}

export async function run() {
    console.log("\n✈️ Testing MMT Integration...");

    const USERNAME = process.env.MMT_INBOUND_USERNAME;
    const PASSWORD = process.env.MMT_INBOUND_PASSWORD;

    if (!USERNAME || !PASSWORD) {
        console.warn("⚠️  Skipping MMT tests: Missing .env credentials");
        return;
    }

    const AUTH_HEADER = {
        headers: {
            'Authorization': `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64")}`
        }
    };

    let bookingId = "";
    const mmtRefId = `MMT_${Date.now()}`;

    // 1. Block
    try {
        const res = await axios.post(`${BASE_URL}/partners/mmt/partnerblockendpoint`, {
            skuId: "TATA_TIGOR_EV",
            mmtRefId: mmtRefId,
            pickupTime: getFutureDate(26), // > 24h
            pickupCity: "DELHI",
            dropCity: "GURGAON",
            distanceKm: 30
        }, AUTH_HEADER);
        bookingId = res.data.data.bookingId;
        console.log(`✅ MMT Block Successful: ${bookingId}`);
    } catch (e: any) {
        console.error(`❌ MMT Block Failed: ${e.message}`);
        // Cannot proceed if block fails
        return;
    }

    // 2. Reschedule (Testing New Logic)
    try {
        const res = await axios.post(`${BASE_URL}/partners/mmt/partnerrescheduleblockendpoint`, {
            order_reference_number: bookingId,
            start_time: getFutureDate(30)
        }, AUTH_HEADER);

        const code = res.data.data.response.verification_code;
        if (code && code.length === 4) {
            console.log(`✅ MMT Reschedule Successful. OTP Generated: ${code}`);
        } else {
            console.error(`❌ MMT Reschedule Failed: Invalid OTP format '${code}'`);
        }
    } catch (e: any) {
        console.error(`❌ MMT Reschedule Failed: ${e.message}`);
    }
}

if (process.argv[1] === import.meta.filename) {
    (async () => {
        try { await run(); } catch (e) { console.error(e); }
    })();
}
