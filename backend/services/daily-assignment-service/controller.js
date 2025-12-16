import prisma from '../../shared/prisma.js';

// Assign vehicle to driver for today
export const assignVehicleForToday = async (req, res) => {
  try {
    const { driverId, vehicleId } = req.body;

    if (!driverId || !vehicleId) {
      return res.status(400).json({
        message: 'driverId and vehicleId are required',
      });
    }

    // Normalize date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignment = await prisma.dailyAssignment.create({
      data: {
        date: today,
        driverId,
        vehicleId,
      },
    });

    res.status(201).json({
      message: 'Vehicle assigned to driver for today',
      assignment,
    });
  } catch (error) {
    console.error(error);

    // Prisma unique constraint error
    if (error.code === 'P2002') {
      return res.status(400).json({
        message:
          'Driver or vehicle already assigned for today',
      });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

// Get today assignment for a driver
export const getTodayAssignmentByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignment = await prisma.dailyAssignment.findFirst({
      where: {
        driverId,
        date: today,
      },
      include: {
        vehicle: true,
      },
    });

    res.json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
