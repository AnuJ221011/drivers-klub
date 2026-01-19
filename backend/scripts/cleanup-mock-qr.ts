/**
 * Cleanup Mock VirtualQR Records
 * 
 * This script removes VirtualQR records that contain mock/test data,
 * allowing the system to regenerate real QR codes from Easebuzz.
 * 
 * Run: npx tsx scripts/cleanup-mock-qr.ts
 */

import 'dotenv/config';
import { prisma } from '@driversklub/database';

async function cleanupMockQRs() {
    console.log('🧹 Cleaning up mock VirtualQR records...\n');

    // Find all QRs with test/mock data patterns
    const mockQRs = await prisma.virtualQR.findMany({
        where: {
            OR: [
                { virtualAccountNumber: { startsWith: 'TEST' } },
                { ifscCode: { startsWith: 'TEST' } },
                { qrCodeBase64: { contains: 'mock' } },
                { virtualAccountId: { startsWith: 'VA_' } }, // Old format mock IDs
            ]
        },
        include: {
            vehicle: {
                select: { vehicleNumber: true }
            }
        }
    });

    if (mockQRs.length === 0) {
        console.log('✅ No mock QR records found. All QRs are real.');
        return;
    }

    console.log(`Found ${mockQRs.length} mock QR record(s):\n`);

    for (const qr of mockQRs) {
        console.log(`  - Vehicle: ${qr.vehicle?.vehicleNumber || 'Unknown'}`);
        console.log(`    VA ID: ${qr.virtualAccountId}`);
        console.log(`    VA Number: ${qr.virtualAccountNumber}`);
        console.log(`    IFSC: ${qr.ifscCode}`);
        console.log(`    Created: ${qr.createdAt}`);
        console.log('');
    }

    // Delete mock records
    const result = await prisma.virtualQR.deleteMany({
        where: {
            id: { in: mockQRs.map(q => q.id) }
        }
    });

    console.log(`\n🗑️  Deleted ${result.count} mock QR record(s).`);
    console.log('\n✅ You can now regenerate real QR codes by calling:');
    console.log('   POST /payments/admin/vehicle/:vehicleId/qr');
}

cleanupMockQRs()
    .then(() => {
        console.log('\n✨ Cleanup complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
