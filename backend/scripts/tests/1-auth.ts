import { apiCall, globalContext } from "./utils.js";
import { ADMIN_PHONE, DRIVER_PHONE } from "./setup.js";

export async function run() {
    console.log("\n🔐 Testing Authentication...");

    // 1. Admin Login
    const adminRes = await apiCall("POST", "/auth/verify-otp", {
        phone: ADMIN_PHONE,
        otp: "000000",
        verifiedKey: "pass"
    });

    if (adminRes.success) {
        // Handle potential response wrapping
        const token = adminRes.data.accessToken || adminRes.data.data?.accessToken;
        globalContext.adminToken = token;

        if (!token) console.log("⚠️ Admin Auth Response:", JSON.stringify(adminRes.data, null, 2));
        console.log(`✅ Admin login successful (Token: ${globalContext.adminToken ? 'OK' : 'MISSING'})`);
    } else {
        console.error(`❌ Admin login failed: ${adminRes.error}`);
        throw new Error("Admin login failed");
    }

    // 1.1 Public Driver Signup Flow
    console.log("   Testing Public Signup Flow...");

    // A. Verify Phone
    const verifyPhoneRes = await apiCall("POST", "/users/drivers/verify", { phone: "9870000000" });
    if (verifyPhoneRes.success) {
        console.log("      ✅ Verify Phone Passed (New User)");
    } else {
        console.error("      ❌ Verify Phone Failed:", verifyPhoneRes.error || verifyPhoneRes.data);
    }

    // B. Public Signup
    const publicSignupRes = await apiCall("POST", "/users/drivers/signup", {
        name: "Public Driver Test",
        phone: "9870000000"
    });

    if (publicSignupRes.success) {
        const userId = publicSignupRes.data?.data?.user?.id || publicSignupRes.data?.user?.id;
        console.log(`      ✅ Public Signup Passed. Driver ID: ${userId}`);
    } else {
        console.error("      ❌ Public Signup Failed:", publicSignupRes.error);
    }

    // 2. Driver Login
    const driverRes = await apiCall("POST", "/auth/verify-otp", {
        phone: DRIVER_PHONE,
        otp: "000000",
        verifiedKey: "pass"
    });

    if (driverRes.success) {
        const token = driverRes.data.accessToken || driverRes.data.data?.accessToken;
        globalContext.driverToken = token;

        if (!token) console.log("⚠️ Driver Auth Response:", JSON.stringify(driverRes.data, null, 2));
        console.log(`✅ Driver login successful (Token: ${globalContext.driverToken ? 'OK' : 'MISSING'})`);
    } else {
        console.error(`❌ Driver login failed: ${driverRes.error}`);
        throw new Error("Driver login failed");
    }
}


// Standalone
if (process.argv[1] === import.meta.filename) {
    (async () => {
        try { await run(); } catch (e) { console.error(e); }
    })();
}
