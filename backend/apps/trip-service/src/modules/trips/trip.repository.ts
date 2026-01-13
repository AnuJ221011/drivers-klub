import { prisma } from "@driversklub/database";

export class TripRepository {
  create(data: any) {
    // Mapping legacy fields to Ride Schema
    return prisma.ride.create({
      data: {
        tripType: "INTER_CITY", // Default or passed? Service should pass.
        originCity: data.pickup?.split(" ")[0] || "Unknown", // Naive parsing or Service handles?
        destinationCity: data.drop?.split(" ")[0] || "Unknown",
        pickupLocation: data.pickup,
        dropLocation: data.drop,
        pickupTime: new Date(), // Defaulting to now for manual trips
        distanceKm: 0, // Placeholder
        status: "CREATED",
        // We need to create TripAssignment too for the driver
        tripAssignments: {
          create: {
            driverId: data.driverId,
            status: "ASSIGNED"
          }
        }
      }
    });
  }

  findById(id: string) {
    return prisma.ride.findUnique({
      where: { id },
      include: { tripAssignments: true }
    });
  }

  findByFleet(fleetId: string) {
    return prisma.ride.findMany({
      where: {
        tripAssignments: {
          some: {
            driver: { fleetId }
          }
        }
      },
      include: { tripAssignments: true }
    });
  }

  findByDriver(driverId: string) {
    return prisma.ride.findMany({
      where: {
        tripAssignments: {
          some: { driverId }
        }
      },
      include: { tripAssignments: true }
    });
  }

  startTrip(id: string) {
    return prisma.ride.update({
      where: { id },
      data: { status: "STARTED", startedAt: new Date() }
    });
  }

  completeTrip(id: string, fare?: number) {
    return prisma.ride.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        price: fare // Mapping 'fare' to 'price'
      }
    });
  }
}
