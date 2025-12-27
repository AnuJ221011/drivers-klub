import { PrismaClient, TripType, TripStatus, AssignmentStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addTripsForDriver() {
    console.log("🚀 Adding 7 Additional Trips for Driver (9123456784)...\n");

    try {
        // Find the driver by phone number
        const user = await prisma.user.findUnique({
            where: { phone: "9123456784" },
            include: { driver: true }
        });

        if (!user || !user.driver) {
            throw new Error("Driver with phone 9123456784 not found!");
        }

        const driver = user.driver;
        console.log(`✅ Found Driver: ${driver.firstName} ${driver.lastName} (ID: ${driver.id})\n`);

        // Create 7 additional trips
        const trips = [];

        // Trip 1 - Airport Trip (Completed)
        const trip1 = await prisma.ride.create({
            data: {
                tripType: TripType.AIRPORT,
                originCity: "NOIDA",
                destinationCity: "DELHI",
                pickupLocation: "Sector 18, Noida",
                dropLocation: "IGI Airport Terminal 1, Delhi",
                pickupLat: 28.5677,
                pickupLng: 77.3211,
                dropLat: 28.5562,
                dropLng: 77.1000,
                pickupTime: new Date("2025-12-15T04:30:00Z"),
                startedAt: new Date("2025-12-15T04:35:00Z"),
                completedAt: new Date("2025-12-15T05:45:00Z"),
                distanceKm: 22.5,
                billableKm: 23,
                ratePerKm: 15,
                price: 345,
                vehicleSku: "SUV",
                status: TripStatus.COMPLETED
            }
        });
        await prisma.tripAssignment.create({
            data: {
                tripId: trip1.id,
                driverId: driver.id,
                status: AssignmentStatus.COMPLETED
            }
        });
        trips.push(trip1);
        console.log(`✅ Trip 1: ${trip1.tripType} - ${trip1.originCity} to ${trip1.destinationCity} (${trip1.status})`);

        // Trip 2 - Inter-City Trip (Completed)
        const trip2 = await prisma.ride.create({
            data: {
                tripType: TripType.INTER_CITY,
                originCity: "NOIDA",
                destinationCity: "LUCKNOW",
                pickupLocation: "Sector 62, Noida",
                dropLocation: "Hazratganj, Lucknow",
                pickupLat: 28.6271,
                pickupLng: 77.3716,
                dropLat: 26.8467,
                dropLng: 80.9462,
                pickupTime: new Date("2025-12-16T07:00:00Z"),
                startedAt: new Date("2025-12-16T07:10:00Z"),
                completedAt: new Date("2025-12-16T13:30:00Z"),
                distanceKm: 520,
                billableKm: 520,
                ratePerKm: 11,
                price: 5720,
                vehicleSku: "SUV",
                status: TripStatus.COMPLETED
            }
        });
        await prisma.tripAssignment.create({
            data: {
                tripId: trip2.id,
                driverId: driver.id,
                status: AssignmentStatus.COMPLETED
            }
        });
        trips.push(trip2);
        console.log(`✅ Trip 2: ${trip2.tripType} - ${trip2.originCity} to ${trip2.destinationCity} (${trip2.status})`);

        // Trip 3 - Rental Trip (Completed)
        const trip3 = await prisma.ride.create({
            data: {
                tripType: TripType.RENTAL,
                originCity: "NOIDA",
                destinationCity: "NOIDA",
                pickupLocation: "Sector 16, Noida",
                dropLocation: "Sector 16, Noida",
                pickupLat: 28.5820,
                pickupLng: 77.3220,
                dropLat: 28.5820,
                dropLng: 77.3220,
                pickupTime: new Date("2025-12-18T09:00:00Z"),
                startedAt: new Date("2025-12-18T09:05:00Z"),
                completedAt: new Date("2025-12-18T17:00:00Z"),
                distanceKm: 95,
                billableKm: 95,
                ratePerKm: 10,
                price: 950,
                vehicleSku: "SUV",
                status: TripStatus.COMPLETED
            }
        });
        await prisma.tripAssignment.create({
            data: {
                tripId: trip3.id,
                driverId: driver.id,
                status: AssignmentStatus.COMPLETED
            }
        });
        trips.push(trip3);
        console.log(`✅ Trip 3: ${trip3.tripType} - ${trip3.originCity} (${trip3.status})`);

        // Trip 4 - Airport Trip (Completed)
        const trip4 = await prisma.ride.create({
            data: {
                tripType: TripType.AIRPORT,
                originCity: "NOIDA",
                destinationCity: "DELHI",
                pickupLocation: "Sector 50, Noida",
                dropLocation: "IGI Airport Terminal 3, Delhi",
                pickupLat: 28.5706,
                pickupLng: 77.3600,
                dropLat: 28.5562,
                dropLng: 77.1000,
                pickupTime: new Date("2025-12-19T14:00:00Z"),
                startedAt: new Date("2025-12-19T14:05:00Z"),
                completedAt: new Date("2025-12-19T15:20:00Z"),
                distanceKm: 28,
                billableKm: 28,
                ratePerKm: 15,
                price: 420,
                vehicleSku: "SUV",
                status: TripStatus.COMPLETED
            }
        });
        await prisma.tripAssignment.create({
            data: {
                tripId: trip4.id,
                driverId: driver.id,
                status: AssignmentStatus.COMPLETED
            }
        });
        trips.push(trip4);
        console.log(`✅ Trip 4: ${trip4.tripType} - ${trip4.originCity} to ${trip4.destinationCity} (${trip4.status})`);

        // Trip 5 - Inter-City Trip (Completed)
        const trip5 = await prisma.ride.create({
            data: {
                tripType: TripType.INTER_CITY,
                originCity: "NOIDA",
                destinationCity: "MATHURA",
                pickupLocation: "Sector 137, Noida",
                dropLocation: "Krishna Janmabhoomi, Mathura",
                pickupLat: 28.6050,
                pickupLng: 77.4050,
                dropLat: 27.5036,
                dropLng: 77.6735,
                pickupTime: new Date("2025-12-21T05:30:00Z"),
                startedAt: new Date("2025-12-21T05:35:00Z"),
                completedAt: new Date("2025-12-21T08:45:00Z"),
                distanceKm: 145,
                billableKm: 145,
                ratePerKm: 12,
                price: 1740,
                vehicleSku: "SUV",
                status: TripStatus.COMPLETED
            }
        });
        await prisma.tripAssignment.create({
            data: {
                tripId: trip5.id,
                driverId: driver.id,
                status: AssignmentStatus.COMPLETED
            }
        });
        trips.push(trip5);
        console.log(`✅ Trip 5: ${trip5.tripType} - ${trip5.originCity} to ${trip5.destinationCity} (${trip5.status})`);

        // Trip 6 - Airport Trip (Started - Currently Active)
        const trip6 = await prisma.ride.create({
            data: {
                tripType: TripType.AIRPORT,
                originCity: "NOIDA",
                destinationCity: "DELHI",
                pickupLocation: "Sector 76, Noida",
                dropLocation: "IGI Airport Terminal 2, Delhi",
                pickupLat: 28.5700,
                pickupLng: 77.3800,
                dropLat: 28.5562,
                dropLng: 77.1000,
                pickupTime: new Date("2025-12-24T10:00:00Z"),
                startedAt: new Date("2025-12-24T10:05:00Z"),
                distanceKm: 26,
                billableKm: 26,
                ratePerKm: 15,
                price: 390,
                vehicleSku: "SUV",
                status: TripStatus.STARTED
            }
        });
        await prisma.tripAssignment.create({
            data: {
                tripId: trip6.id,
                driverId: driver.id,
                status: AssignmentStatus.ASSIGNED
            }
        });
        trips.push(trip6);
        console.log(`✅ Trip 6: ${trip6.tripType} - ${trip6.originCity} to ${trip6.destinationCity} (${trip6.status})`);

        // Trip 7 - Rental Trip (Driver Assigned - Upcoming)
        const trip7 = await prisma.ride.create({
            data: {
                tripType: TripType.RENTAL,
                originCity: "NOIDA",
                destinationCity: "NOIDA",
                pickupLocation: "Sector 128, Noida",
                dropLocation: "Sector 128, Noida",
                pickupLat: 28.5450,
                pickupLng: 77.3350,
                dropLat: 28.5450,
                dropLng: 77.3350,
                pickupTime: new Date("2025-12-26T08:00:00Z"),
                distanceKm: 0,
                billableKm: 80,
                ratePerKm: 10,
                price: 800,
                vehicleSku: "SUV",
                status: TripStatus.DRIVER_ASSIGNED
            }
        });
        await prisma.tripAssignment.create({
            data: {
                tripId: trip7.id,
                driverId: driver.id,
                status: AssignmentStatus.ASSIGNED
            }
        });
        trips.push(trip7);
        console.log(`✅ Trip 7: ${trip7.tripType} - ${trip7.originCity} (${trip7.status})`);

        console.log("\n═══════════════════════════════════════════════════════════");
        console.log("✅ 7 ADDITIONAL TRIPS CREATED SUCCESSFULLY!");
        console.log("═══════════════════════════════════════════════════════════\n");

        // Summary
        console.log("📊 TRIP SUMMARY FOR MANOJ VERMA (9123456784):\n");
        console.log("┌─────────────────────────────────────────────────────────┐");
        console.log("│ TRIPS BREAKDOWN                                         │");
        console.log("├─────────────────────────────────────────────────────────┤");

        const completedTrips = trips.filter(t => t.status === TripStatus.COMPLETED);
        const activeTrips = trips.filter(t => t.status === TripStatus.STARTED);
        const upcomingTrips = trips.filter(t => t.status === TripStatus.DRIVER_ASSIGNED);

        console.log(`│ ✅ Completed Trips: ${completedTrips.length}                                  │`);
        console.log(`│ 🚗 Active Trips: ${activeTrips.length}                                     │`);
        console.log(`│ 📅 Upcoming Trips: ${upcomingTrips.length}                                   │`);
        console.log(`│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │`);
        console.log(`│ 📍 Total Trips: ${trips.length}                                        │`);
        console.log("└─────────────────────────────────────────────────────────┘\n");

        console.log("┌─────────────────────────────────────────────────────────┐");
        console.log("│ TRIP DETAILS                                            │");
        console.log("├─────────────────────────────────────────────────────────┤");
        trips.forEach((trip, index) => {
            const statusEmoji = trip.status === TripStatus.COMPLETED ? '✅' :
                trip.status === TripStatus.STARTED ? '🚗' : '📅';
            console.log(`│ ${statusEmoji} Trip ${index + 1}: ${trip.tripType.padEnd(10)} | ${trip.status.padEnd(18)} │`);
            console.log(`│    ${trip.originCity} → ${trip.destinationCity.padEnd(20)} │`);
            console.log(`│    Distance: ${trip.distanceKm}km | Price: ₹${trip.price}${' '.repeat(20 - trip.price.toString().length)} │`);
        });
        console.log("└─────────────────────────────────────────────────────────┘\n");

        const totalRevenue = trips.reduce((sum, trip) => sum + (trip.price || 0), 0);
        const totalDistance = trips.reduce((sum, trip) => sum + trip.distanceKm, 0);

        console.log("💰 EARNINGS SUMMARY:");
        console.log(`   Total Revenue: ₹${totalRevenue}`);
        console.log(`   Total Distance: ${totalDistance} km`);
        console.log(`   Average per Trip: ₹${Math.round(totalRevenue / trips.length)}\n`);

        console.log("✅ All trips added successfully!");
        console.log("✅ Driver now has 8 total trips (including the original one)!\n");

    } catch (error) {
        console.error("❌ Error adding trips:", error);
        throw error;
    } finally {
        await pool.end();
        await prisma.$disconnect();
    }
}

// Run the script
addTripsForDriver()
    .then(() => {
        console.log("✅ Script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
