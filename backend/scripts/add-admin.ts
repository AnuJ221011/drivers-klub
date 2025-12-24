import "dotenv/config";
import { UserRole } from "@prisma/client";
import { prisma } from "../src/utils/prisma.js";

async function main() {
    const phone = "9999999999";
    const name = "System Admin";

    console.log(`Checking for admin user with phone: ${phone}...`);

    try {
        const admin = await prisma.user.upsert({
            where: { phone },
            update: {
                role: UserRole.SUPER_ADMIN, // Ensure existing user becomes Admin if not
                isActive: true
            },
            create: {
                name,
                phone,
                role: UserRole.SUPER_ADMIN,
                isActive: true,
            },
        });

        console.log(`✅ Admin user ready: ${admin.name} - ${admin.phone} (ID: ${admin.id})`);
    } catch (e) {
        console.error("❌ Failed to seed admin:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
