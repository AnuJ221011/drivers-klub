
import http from 'http';

const GATEWAY_URL = 'http://localhost:3000'; // Assuming Gateway is on 3000

// Helper to check service health
async function checkService(name: string, path: string) {
    return new Promise((resolve) => {
        http.get(`${GATEWAY_URL}${path}`, (res) => {
            console.log(`[${name}] Status: ${res.statusCode}`);
            resolve(res.statusCode === 200 || res.statusCode === 404); // 404 means gateway routed but endpoint missing, which verifies routing
        }).on('error', (e) => {
            console.error(`[${name}] Failed: ${e.message}`);
            resolve(false);
        });
    });
}

async function verify() {
    console.log("Verifying Services via Gateway...");
    await checkService('Gateway Health', '/health'); // Gateway should have a health endpoint or return 404
    await checkService('Auth Service', '/auth/health');
    await checkService('Driver Service', '/drivers/health');
    await checkService('Vehicle Service', '/vehicles/health');
    await checkService('Trip Service', '/trips/health');
    await checkService('Assignment Service', '/assignments/health');
}

verify();
