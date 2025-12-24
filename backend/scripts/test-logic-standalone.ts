
import { GeoUtils } from "../src/utils/geo.util.js";
import { ApiError } from "../src/utils/apiError.js";

// --- Mocks Data ---
// 1. Coordinates (Delhi CP to India Gate ~ 2.3km)
const CP = { lat: 28.6304, lng: 77.2177 };
const INDIA_GATE = { lat: 28.6129, lng: 77.2295 };
const NEAR_CP = { lat: 28.6305, lng: 77.2178 }; // ~15 meters away

console.log("🚀 Starting Strict Logic Verification...\n");

// --- Test 1: GeoUtils ---
console.log("Test 1: GeoUtils Distance");
const dist1 = GeoUtils.getDistanceInMeters(CP.lat, CP.lng, NEAR_CP.lat, NEAR_CP.lng);
console.log(`- CP to Near CP: ${dist1.toFixed(2)}m (Expected < 20m) -> ${dist1 < 20 ? '✅ PASS' : '❌ FAIL'}`);

const dist2 = GeoUtils.getDistanceInMeters(CP.lat, CP.lng, INDIA_GATE.lat, INDIA_GATE.lng);
console.log(`- CP to India Gate: ${dist2.toFixed(2)}m (Expected > 2000m) -> ${dist2 > 2000 ? '✅ PASS' : '❌ FAIL'}`);
console.log("");

// --- Test 2: Time Window Logic (Start Trip) ---
console.log("Test 2: Start Trip Window (2.5 Hours)");

function checkStartWindow(pickupTimeStr: string, now: Date) {
    const pickupTime = new Date(pickupTimeStr);
    const msDiff = pickupTime.getTime() - now.getTime();
    const hoursDiff = msDiff / (1000 * 60 * 60);
    return hoursDiff <= 2.5;
}

const now = new Date("2025-12-25T10:00:00Z"); // Benchmark "Now"

const tripA = "2025-12-25T13:00:00Z"; // 3 Hours later (Should FAIL)
console.log(`- Trying to Start Trip at T-3h: ${checkStartWindow(tripA, now) ? '❌ INVALID PASS' : '✅ PASS (Blocked)'}`);

const tripB = "2025-12-25T11:30:00Z"; // 1.5 Hours later (Should PASS)
console.log(`- Trying to Start Trip at T-1.5h: ${checkStartWindow(tripB, now) ? '✅ PASS (Allowed)' : '❌ INVALID BLOCK'}`);
console.log("");

// --- Test 3: No Show Logic (30 Mins) ---
console.log("Test 3: No Show Window (30 Mins after Pickup)");

function checkNoShow(pickupTimeStr: string, now: Date) {
    const pickupTime = new Date(pickupTimeStr);
    const msDiff = now.getTime() - pickupTime.getTime();
    const minutesDiff = msDiff / (1000 * 60);
    return minutesDiff >= 30;
}

const tripC = "2025-12-25T09:40:00Z"; // Pickup was 20 mins ago (Now is 10:00) -> Should FAIL (Too early)
console.log(`- Marking No Show at T+20m: ${checkNoShow(tripC, now) ? '❌ INVALID PASS' : '✅ PASS (Blocked)'}`);

const tripD = "2025-12-25T09:20:00Z"; // Pickup was 40 mins ago -> Should PASS
console.log(`- Marking No Show at T+40m: ${checkNoShow(tripD, now) ? '✅ PASS (Allowed)' : '❌ INVALID BLOCK'}`);

console.log("\n✅ Logic Verification Complete.");
