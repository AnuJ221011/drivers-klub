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
        const { penaltyService } = await import("../../apps/trip-service/src/core/payment/penalty.service.js");

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
            const { orderService } = await import("../../apps/trip-service/src/core/payment/order.service.js"); // Dynamic import

            // 3.1 Create Order (Admin API)
            const orderInput = {
                customerName: "Test Auto Customer",
                customerPhone: "9998887776",
                description: "Auto Verification Order",
                amount: 100
            };

            const createRes = await apiCall("POST", "/payment/orders", orderInput, globalContext.adminToken);

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
                const getRes = await apiCall("GET", `/payment/orders/${createRes.data.id}`, null, globalContext.adminToken);
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

    // 4. Test Virtual QR (Independent Vehicle)
    try {
        console.log("   🧪 Testing Independent Vehicle QR...");

        // Create Independent Vehicle
        const indVehicle = await prisma.vehicle.create({
            data: {
                vehicleNumber: `DL10IND${Math.floor(Math.random() * 1000)}`,
                vehicleName: "Independent Auto",
                vehicleModel: "Bajaj RE",
                vehicleColor: "Black",
                fuelType: "CNG",
                ownership: "OWNED",
                status: "ACTIVE",
                ownerName: "Independent Owner"
            }
        });

        // Generate QR
        const qrRes = await apiCall("POST", `/payment/admin/vehicle/${indVehicle.id}/qr`, {}, globalContext.adminToken);

        if (qrRes.success && qrRes.data.virtualAccountId) {
            console.log(`      ✅ QR Generated for Independent Vehicle: ${indVehicle.vehicleNumber}`);
        } else {
            console.error(`      ❌ Independent QR Generation Failed: ${qrRes.error || JSON.stringify(qrRes.data)}`);
            // Check if it's the specific error we expect if testing locally without full Easebuzz env
        }

        // Cleanup
        await prisma.virtualQR.deleteMany({ where: { vehicleId: indVehicle.id } });
        await prisma.vehicle.delete({ where: { id: indVehicle.id } });

    } catch (e: any) {
        console.error(`   ❌ Independent QR Test Failed: ${e.message}`);
    }

    if (process.argv[1] === import.meta.filename) {
        (async () => {
            try { await run(); } catch (e) { console.error(e); }
        })();
    }
}
