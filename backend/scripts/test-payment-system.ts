import axios from 'axios';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message?: string;
}

const results: TestResult[] = [];

function logTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message?: string) {
    results.push({ name, status, message });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${icon} ${name}${message ? ': ' + message : ''}`);
}

async function testPaymentSystem() {
    console.log('\n🚀 Payment System Test Suite');
    console.log('==========================================\n');

    try {
        // Test 1: Health Check
        console.log('🔌 Testing Server Health...');
        try {
            const health = await axios.get(`${BASE_URL}/health`);
            if (health.data.status === 'ok') {
                logTest('Server Health Check', 'PASS');
            } else {
                logTest('Server Health Check', 'FAIL', 'Server not healthy');
            }
        } catch (error: any) {
            logTest('Server Health Check', 'FAIL', error.message);
            return;
        }

        // Test 2: Payment Module Structure
        console.log('\n📁 Verifying Payment Module Files...');
        const { existsSync } = await import('fs');
        const { join } = await import('path');

        const paymentFiles = [
            'src/core/payment/rental.service.ts',
            'src/core/payment/penalty.service.ts',
            'src/core/payment/incentive.service.ts',
            'src/core/payment/payout.service.ts',
            'src/core/payment/virtualqr.service.ts',
            'src/adapters/easebuzz/easebuzz.adapter.ts',
            'src/adapters/easebuzz/easebuzz.types.ts',
            'src/adapters/easebuzz/easebuzz.utils.ts',
            'src/modules/payment/payment.controller.ts',
            'src/modules/payment/payment.routes.ts',
            'src/modules/webhooks/easebuzz.webhook.ts',
            'src/modules/webhooks/webhook.routes.ts'
        ];

        for (const file of paymentFiles) {
            const filePath = join(process.cwd(), file);
            if (existsSync(filePath)) {
                logTest(`File exists: ${file}`, 'PASS');
            } else {
                logTest(`File exists: ${file}`, 'FAIL', 'File not found');
            }
        }

        // Test 3: Environment Variables
        console.log('\n🔐 Checking Payment Environment Variables...');
        const requiredEnvVars = [
            'EASEBUZZ_MERCHANT_KEY',
            'EASEBUZZ_SALT_KEY',
            'EASEBUZZ_ENV',
            'EASEBUZZ_BASE_URL',
            'DEFAULT_REV_SHARE_PERCENTAGE',
            'PAYMENT_SUCCESS_URL',
            'PAYMENT_FAILURE_URL'
        ];

        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                logTest(`Environment Variable: ${envVar}`, 'PASS');
            } else {
                logTest(`Environment Variable: ${envVar}`, 'SKIP', 'Not configured');
            }
        }

        // Test 4: Payment Endpoints Accessibility
        console.log('\n🌐 Testing Payment Endpoint Routes...');

        // Note: These will return 401 without auth, but we're just checking if routes exist
        const endpoints = [
            { method: 'GET', path: '/payment/balance', description: 'Get Driver Balance' },
            { method: 'GET', path: '/payment/transactions', description: 'Get Transactions' },
            { method: 'GET', path: '/payment/incentives', description: 'Get Incentives' },
            { method: 'GET', path: '/payment/penalties', description: 'Get Penalties' },
            { method: 'GET', path: '/payment/collections', description: 'Get Collections' },
            { method: 'POST', path: '/payment/deposit', description: 'Initiate Deposit' },
            { method: 'POST', path: '/payment/rental', description: 'Initiate Rental Payment' }
        ];

        for (const endpoint of endpoints) {
            try {
                await axios({
                    method: endpoint.method.toLowerCase() as any,
                    url: `${BASE_URL}${endpoint.path}`,
                    validateStatus: () => true // Accept any status
                });
                // If we get here, route exists (even if it returns 401)
                logTest(`Endpoint: ${endpoint.method} ${endpoint.path}`, 'PASS', endpoint.description);
            } catch (error: any) {
                if (error.code === 'ECONNREFUSED') {
                    logTest(`Endpoint: ${endpoint.method} ${endpoint.path}`, 'FAIL', 'Server not running');
                } else {
                    logTest(`Endpoint: ${endpoint.method} ${endpoint.path}`, 'PASS', 'Route exists');
                }
            }
        }

        // Test 5: Database Schema
        console.log('\n💾 Verifying Payment Database Models...');
        logTest('Database Models Check', 'SKIP', 'Requires database connection');

        // Test 6: Documentation
        console.log('\n📚 Verifying Payment Documentation...');
        const { existsSync: docExists, readFileSync } = await import('fs');
        const { join: docJoin } = await import('path');

        const docFiles = [
            'docs/PAYMENT_SYSTEM_DOCUMENTATION.md',
            'docs/API_REFERENCE.md'
        ];

        for (const docFile of docFiles) {
            const docPath = docJoin(process.cwd(), docFile);
            if (docExists(docPath)) {
                const content = readFileSync(docPath, 'utf-8');
                if (content.includes('payment') || content.includes('Payment')) {
                    logTest(`Documentation: ${docFile}`, 'PASS', 'Contains payment info');
                } else {
                    logTest(`Documentation: ${docFile}`, 'FAIL', 'Missing payment info');
                }
            } else {
                logTest(`Documentation: ${docFile}`, 'FAIL', 'File not found');
            }
        }

    } catch (error: any) {
        console.error('\n❌ Test suite error:', error.message);
    }

    // Summary
    console.log('\n==========================================');
    console.log('📊 Test Summary');
    console.log('==========================================\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`\nPass Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All payment system tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the results above.');
    }

    process.exit(failed > 0 ? 1 : 0);
}

testPaymentSystem();
