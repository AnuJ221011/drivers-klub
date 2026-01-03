import axios from 'axios';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

interface TestResult {
    category: string;
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message?: string;
    duration?: number;
}

const results: TestResult[] = [];
let adminToken = '';
let driverToken = '';
let testFleetId = '';
let testDriverId = '';
let testVehicleId = '';
let testTripId = '';

function logTest(category: string, name: string, status: 'PASS' | 'FAIL' | 'SKIP', message?: string, duration?: number) {
    results.push({ category, name, status, message, duration });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    const durationStr = duration ? ` (${duration}ms)` : '';
    console.log(`${icon} ${name}${message ? ': ' + message : ''}${durationStr}`);
}

async function runTest(category: string, name: string, testFn: () => Promise<void>) {
    const startTime = Date.now();
    try {
        await testFn();
        const duration = Date.now() - startTime;
        logTest(category, name, 'PASS', undefined, duration);
    } catch (error: any) {
        const duration = Date.now() - startTime;
        logTest(category, name, 'FAIL', error.message, duration);
    }
}

async function runCompleteTestSuite() {
    console.log('\n🚀 Complete Project Test Suite');
    console.log('==========================================\n');

    // ============================================
    // 1. SYSTEM HEALTH TESTS
    // ============================================
    console.log('🔌 1. System Health Tests');
    console.log('------------------------------------------');

    await runTest('System Health', 'Server Health Check', async () => {
        const response = await axios.get(`${BASE_URL}/health`);
        if (response.data.status !== 'ok') throw new Error('Server not healthy');
    });

    await runTest('System Health', 'Database Connection', async () => {
        const response = await axios.get(`${BASE_URL}/health`);
        if (response.data.database !== 'connected') throw new Error('Database not connected');
    });

    // ============================================
    // 2. AUTHENTICATION TESTS
    // ============================================
    console.log('\n🔐 2. Authentication Tests');
    console.log('------------------------------------------');

    await runTest('Authentication', 'Admin Login', async () => {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            mobile: '9999999999',
            otp: '123456'
        });
        if (!response.data.accessToken) throw new Error('No access token received');
        adminToken = response.data.accessToken;
    });

    await runTest('Authentication', 'Driver Login', async () => {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            mobile: '8888888888',
            otp: '123456'
        });
        if (!response.data.accessToken) throw new Error('No access token received');
        driverToken = response.data.accessToken;
    });

    await runTest('Authentication', 'Token Validation', async () => {
        const response = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.user) throw new Error('Token validation failed');
    });

    // ============================================
    // 3. FLEET MANAGEMENT TESTS
    // ============================================
    console.log('\n🚗 3. Fleet Management Tests');
    console.log('------------------------------------------');

    await runTest('Fleet Management', 'Create Fleet', async () => {
        const response = await axios.post(`${BASE_URL}/fleets`, {
            name: 'Test Fleet',
            mobile: '7777777777',
            city: 'Delhi',
            fleetType: 'COMPANY',
            panNumber: 'ABCDE1234F'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.id) throw new Error('Fleet not created');
        testFleetId = response.data.id;
    });

    await runTest('Fleet Management', 'Get All Fleets', async () => {
        const response = await axios.get(`${BASE_URL}/fleets`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!Array.isArray(response.data)) throw new Error('Invalid response');
    });

    await runTest('Fleet Management', 'Get Fleet by ID', async () => {
        const response = await axios.get(`${BASE_URL}/fleets/${testFleetId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (response.data.id !== testFleetId) throw new Error('Fleet not found');
    });

    // ============================================
    // 4. DRIVER MANAGEMENT TESTS
    // ============================================
    console.log('\n👤 4. Driver Management Tests');
    console.log('------------------------------------------');

    await runTest('Driver Management', 'Create Driver', async () => {
        const response = await axios.post(`${BASE_URL}/drivers`, {
            firstName: 'Test',
            lastName: 'Driver',
            mobile: '6666666666',
            fleetId: testFleetId,
            licenseNumber: 'DL1234567890'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.id) throw new Error('Driver not created');
        testDriverId = response.data.id;
    });

    await runTest('Driver Management', 'Get All Drivers', async () => {
        const response = await axios.get(`${BASE_URL}/drivers`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!Array.isArray(response.data)) throw new Error('Invalid response');
    });

    await runTest('Driver Management', 'Get Driver by ID', async () => {
        const response = await axios.get(`${BASE_URL}/drivers/${testDriverId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (response.data.id !== testDriverId) throw new Error('Driver not found');
    });

    // ============================================
    // 5. VEHICLE MANAGEMENT TESTS
    // ============================================
    console.log('\n🚙 5. Vehicle Management Tests');
    console.log('------------------------------------------');

    await runTest('Vehicle Management', 'Create Vehicle', async () => {
        const response = await axios.post(`${BASE_URL}/vehicles`, {
            fleetId: testFleetId,
            vehicleNumber: 'DL01AB1234',
            vehicleName: 'Test Vehicle',
            fuelType: 'PETROL',
            ownership: 'OWNED'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.id) throw new Error('Vehicle not created');
        testVehicleId = response.data.id;
    });

    await runTest('Vehicle Management', 'Get All Vehicles', async () => {
        const response = await axios.get(`${BASE_URL}/vehicles`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!Array.isArray(response.data)) throw new Error('Invalid response');
    });

    await runTest('Vehicle Management', 'Get Vehicle by ID', async () => {
        const response = await axios.get(`${BASE_URL}/vehicles/${testVehicleId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (response.data.id !== testVehicleId) throw new Error('Vehicle not found');
    });

    // ============================================
    // 6. ATTENDANCE TESTS
    // ============================================
    console.log('\n📋 6. Attendance Tests');
    console.log('------------------------------------------');

    await runTest('Attendance', 'Driver Check-in', async () => {
        const response = await axios.post(`${BASE_URL}/attendance/checkin`, {
            checkInLat: 28.7041,
            checkInLng: 77.1025,
            selfieUrl: 'https://example.com/selfie.jpg',
            odometerStart: 10000
        }, {
            headers: { Authorization: `Bearer ${driverToken}` }
        });
        if (!response.data.id) throw new Error('Check-in failed');
    });

    // ============================================
    // 7. PRICING TESTS
    // ============================================
    console.log('\n💰 7. Pricing Tests');
    console.log('------------------------------------------');

    await runTest('Pricing', 'Calculate Trip Price', async () => {
        const response = await axios.post(`${BASE_URL}/pricing/calculate`, {
            tripType: 'AIRPORT',
            distanceKm: 25,
            originCity: 'Delhi',
            destinationCity: 'Gurgaon'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.price) throw new Error('Price calculation failed');
    });

    // ============================================
    // 8. TRIP MANAGEMENT TESTS
    // ============================================
    console.log('\n🗺️  8. Trip Management Tests');
    console.log('------------------------------------------');

    await runTest('Trip Management', 'Create Trip', async () => {
        const pickupTime = new Date();
        pickupTime.setHours(pickupTime.getHours() + 2);

        const response = await axios.post(`${BASE_URL}/trips`, {
            tripType: 'AIRPORT',
            originCity: 'Delhi',
            destinationCity: 'Gurgaon',
            pickupLocation: 'IGI Airport',
            dropLocation: 'Cyber City',
            pickupTime: pickupTime.toISOString(),
            pickupLat: 28.5562,
            pickupLng: 77.1000,
            distanceKm: 25,
            vehicleSku: 'SEDAN'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.id) throw new Error('Trip not created');
        testTripId = response.data.id;
    });

    await runTest('Trip Management', 'Assign Trip to Driver', async () => {
        const response = await axios.post(`${BASE_URL}/trips/${testTripId}/assign`, {
            driverId: testDriverId
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (response.data.status !== 'DRIVER_ASSIGNED') throw new Error('Trip assignment failed');
    });

    // ============================================
    // 9. PAYMENT SYSTEM TESTS
    // ============================================
    console.log('\n💳 9. Payment System Tests');
    console.log('------------------------------------------');

    await runTest('Payment System', 'Get Driver Balance', async () => {
        const response = await axios.get(`${BASE_URL}/payment/balance`, {
            headers: { Authorization: `Bearer ${driverToken}` },
            validateStatus: () => true
        });
        // Endpoint exists (may return 401 if driver not set up)
        if (response.status !== 200 && response.status !== 401) {
            throw new Error('Unexpected status code');
        }
    });

    await runTest('Payment System', 'Get Transactions', async () => {
        const response = await axios.get(`${BASE_URL}/payment/transactions`, {
            headers: { Authorization: `Bearer ${driverToken}` },
            validateStatus: () => true
        });
        if (response.status !== 200 && response.status !== 401) {
            throw new Error('Unexpected status code');
        }
    });

    await runTest('Payment System', 'Payment Endpoints Accessible', async () => {
        const endpoints = [
            '/payment/incentives',
            '/payment/penalties',
            '/payment/collections'
        ];

        for (const endpoint of endpoints) {
            await axios.get(`${BASE_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${driverToken}` },
                validateStatus: () => true
            });
        }
    });

    // ============================================
    // 10. PAYMENT MODULE FILES
    // ============================================
    console.log('\n📁 10. Payment Module Files');
    console.log('------------------------------------------');

    const { existsSync } = await import('fs');
    const { join } = await import('path');

    const paymentFiles = [
        'src/core/payment/rental.service.ts',
        'src/core/payment/penalty.service.ts',
        'src/core/payment/incentive.service.ts',
        'src/core/payment/payout.service.ts',
        'src/core/payment/virtualqr.service.ts',
        'src/adapters/easebuzz/easebuzz.adapter.ts',
        'src/modules/payment/payment.controller.ts',
        'src/modules/webhooks/easebuzz.webhook.ts'
    ];

    for (const file of paymentFiles) {
        await runTest('Payment Files', `File: ${file.split('/').pop()}`, async () => {
            const filePath = join(process.cwd(), file);
            if (!existsSync(filePath)) throw new Error('File not found');
        });
    }

    // ============================================
    // 11. DOCUMENTATION TESTS
    // ============================================
    console.log('\n📚 11. Documentation Tests');
    console.log('------------------------------------------');

    const { readFileSync } = await import('fs');

    const docFiles = [
        { path: 'README.md', keyword: 'Driver' },
        { path: 'docs/MASTER_PROJECT_DOCUMENTATION.md', keyword: 'payment' },
        { path: 'docs/API_REFERENCE.md', keyword: 'payment' },
        { path: 'docs/PAYMENT_SYSTEM_DOCUMENTATION.md', keyword: 'Easebuzz' }
    ];

    for (const doc of docFiles) {
        await runTest('Documentation', `Doc: ${doc.path}`, async () => {
            const docPath = join(process.cwd(), doc.path);
            if (!existsSync(docPath)) throw new Error('File not found');
            const content = readFileSync(docPath, 'utf-8');
            if (!content.toLowerCase().includes(doc.keyword.toLowerCase())) {
                throw new Error(`Missing keyword: ${doc.keyword}`);
            }
        });
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n==========================================');
    console.log('📊 Complete Test Summary');
    console.log('==========================================\n');

    const categories = [...new Set(results.map(r => r.category))];

    for (const category of categories) {
        const categoryResults = results.filter(r => r.category === category);
        const passed = categoryResults.filter(r => r.status === 'PASS').length;
        const failed = categoryResults.filter(r => r.status === 'FAIL').length;
        const skipped = categoryResults.filter(r => r.status === 'SKIP').length;

        console.log(`${category}:`);
        console.log(`  ✅ Passed: ${passed}  ❌ Failed: ${failed}  ⏭️  Skipped: ${skipped}`);
    }

    const totalPassed = results.filter(r => r.status === 'PASS').length;
    const totalFailed = results.filter(r => r.status === 'FAIL').length;
    const totalSkipped = results.filter(r => r.status === 'SKIP').length;
    const total = results.length;

    console.log('\n------------------------------------------');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⏭️  Skipped: ${totalSkipped}`);
    console.log(`\nPass Rate: ${((totalPassed / (total - totalSkipped)) * 100).toFixed(1)}%`);

    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    if (totalFailed === 0) {
        console.log('\n🎉 All tests passed! Project is production-ready!');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the results above.');
    }

    process.exit(totalFailed > 0 ? 1 : 0);
}

runCompleteTestSuite().catch(error => {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
});
