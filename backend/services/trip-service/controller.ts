import prisma from '../../shared/prisma.js';

import { Request, Response } from 'express';

// CREATE TRIP
export const createTrip = async (req: Request, res: Response) => {
  try {
    const { bookingId, passenger, pickup, drop } = req.body;

    if (!bookingId || !passenger || !pickup || !drop) {
      return res.status(400).json({
        message: 'All trip fields are required',
      });
    }

    const trip = await prisma.trip.create({
      data: {
        bookingId,
        passenger,
        pickup,
        drop,
        status: 'BOOKED',
        events: {
          create: {
            status: 'BOOKED',
            note: 'Trip created',
          },
        },
      },
      include: {
        events: true,
      },
    });

    res.status(201).json({
      message: 'Trip created',
      trip,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ALLOT TRIP TO DRIVER
export const allotTrip = async (req: Request, res: Response) => {
  try {
    const { tripId, driverId } = req.body;

    if (!tripId || !driverId) {
      return res.status(400).json({
        message: 'tripId and driverId are required',
      });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's vehicle for driver
    const assignment = await prisma.dailyAssignment.findFirst({
      where: {
        driverId,
        date: today,
      },
    });

    if (!assignment) {
      return res.status(400).json({
        message: 'Driver has no vehicle assigned today',
      });
    }

    // Update trip
    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        driverId,
        vehicleId: assignment.vehicleId,
        status: 'DRIVER_ALLOTTED',
        events: {
          create: {
            status: 'DRIVER_ALLOTTED',
            note: 'Trip allotted to driver',
          },
        },
      },
      include: {
        driver: true,
        vehicle: true,
        events: true,
      },
    });

    res.json({
      message: 'Trip allotted successfully',
      trip,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL TRIPS
export const getTrips = async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        driver: true,
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE TRIP STATUS (Driver App)
export const updateTripStatus = async (req: Request, res: Response) => {
  try {
    const { tripId, status } = req.body;

    if (!tripId || !status) {
      return res.status(400).json({
        message: 'tripId and status are required',
      });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found',
      });
    }

    // Enforce valid flow
    const validTransitions = {
      DRIVER_ALLOTTED: ['ONGOING'],
      ONGOING: ['COMPLETED'],
    };

    if (
      !validTransitions[trip.status] ||
      !validTransitions[trip.status].includes(status)
    ) {
      return res.status(400).json({
        message: `Invalid status transition from ${trip.status} to ${status}`,
      });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status,
        events: {
          create: {
            status,
            note: `Trip marked as ${status}`,
          },
        },
      },
      include: {
        events: true,
      },
    });

    res.json({
      message: 'Trip status updated',
      trip: updatedTrip,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
