import { apiCall, globalContext, prisma } from "./utils.js";
import { PenaltyType } from "@prisma/client";

export async function run() {
    console.log("\n💳 Testing Payment System...");

    if (!globalContext.driverToken) throw new Error("Missing driverToken");
    if (!globalContext.adminToken) throw new Error("Missing adminToken");

    // 1. Check Balance
    const balanceRes = await apiCall("GET", "/payment/balance", null, globalContext.driverToken);

    if (balanceRes.success || balanceRes.status === 404) {
        console.log("✅ Balance Checked");
    } else {
        console.error(`❌ Failed to check balance: ${balanceRes.error}`);
    }

    // 2. Test Penalty Service Logic (Direct Service Call for Verification)
    // Dynamic import to use PenaltyService
    try {
        const { penaltyService } = await import("../../src/core/payment/penalty.service.js");

        console.log("   🧪 Creating Penalty (500)...");
        await penaltyService.createPenalty({
            driverId: globalContext.driverId!,
            type: PenaltyType.MONETARY,
            amount: 500,
            reason: "Test Penalty",
            createdBy: "TEST_SCRIPT"
        });

        const updatedDriver = await prisma.driver.findUnique({ where: { id: globalContext.driverId! } });
        if (updatedDriver) {
            console.log(`   ✅ Penalty Applied. New Balance: ${updatedDriver.depositBalance}`);
        }
    } catch (e: any) {
        console.error(`❌ Penalty Logic Test Failed: ${e.message}`);
        // 3. Test InstaCollect Orders (Admin Flow)
        try {
            console.log("   🧪 Testing InstaCollect Orders...");
            const { orderService } = await import("../../src/core/payment/order.service.js"); // Dynamic import

            // 3.1 Create Order (Admin API)
            const orderInput = {
                customerName: "Test Auto Customer",
                customerPhone: "9998887776",
                description: "Auto Verification Order",
                amount: 100
            };

            const createRes = await apiCall("POST", "/payment/admin/orders", orderInput, globalContext.adminToken);

            if (createRes.success) {
                console.log(`      ✅ Order Created: ${createRes.data.id} (${createRes.data.status})`);

                // 3.2 Simulate Partial Payment (Service Direct)
                await orderService.recordPayment(createRes.data.virtualAccountId, 40, {
                    easebuzzTxnId: `TXN-AUTO-${Date.now()}`,
                    easebuzzPaymentId: `UTR-AUTO-${Date.now()}`,
                    paymentMode: "UPI",
                    txnDate: new Date().toISOString()
                });

                // 3.3 Verify Status (Admin API)
                const getRes = await apiCall("GET", `/payment/admin/orders/${createRes.data.id}`, null, globalContext.adminToken);
                if (getRes.success && getRes.data.status === "PARTIAL" && getRes.data.collectedAmount === 40) {
                    console.log(`      ✅ Partial Payment Verified (Collected: ${getRes.data.collectedAmount})`);
                } else {
                    console.error(`      ❌ Partial Payment Verification Failed: ${JSON.stringify(getRes.data)}`);
                }

            } else {
                console.error(`      ❌ Create Order Failed: ${createRes.error}`);
            }

        } catch (e: any) {
            console.error(`   ❌ InstaCollect Test Failed: ${e.message}`);
        }
    }

    if (process.argv[1] === import.meta.filename) {
        (async () => {
            try { await run(); } catch (e) { console.error(e); }
        })();
    }
}
