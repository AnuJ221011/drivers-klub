import prisma from '../../shared/prisma.js';

import { Request, Response } from 'express';

// CREATE VEHICLE
export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { number, brand, model, bodyType, fuelType, isActive } = req.body;

    if (!number || !brand || !model || !bodyType || !fuelType) {
      return res.status(400).json({
        message: 'All vehicle fields are required',
      });
    }

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { number },
    });

    if (existingVehicle) {
      return res.status(400).json({
        message: 'Vehicle already exists',
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        number,
        brand,
        model,
        bodyType,
        fuelType,
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
    });

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ASSIGN VEHICLE TO DRIVER
export const assignVehicleToDriver = async (req: Request, res: Response) => {
  try {
    const { vehicleId, driverId } = req.body;

    if (!vehicleId || !driverId) {
      return res.status(400).json({
        message: 'vehicleId and driverId are required',
      });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        driverId,
      },
    });

    res.json({
      message: 'Vehicle assigned to driver',
      vehicle,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL VEHICLES
export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
