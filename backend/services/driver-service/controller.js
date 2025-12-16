import prisma from '../../shared/prisma.js';

// CREATE DRIVER
export const createDriver = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: 'Name and phone are required',
      });
    }

    const existingDriver = await prisma.driver.findUnique({
      where: { phone },
    });

    if (existingDriver) {
      return res.status(400).json({
        message: 'Driver already exists',
      });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
      },
    });

    res.status(201).json({
      message: 'Driver created successfully',
      driver,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL DRIVERS
export const getDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
