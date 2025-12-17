import prisma from '../../shared/prisma.js';
import { generateToken } from '../../shared/jwt.js';
import crypto from 'crypto';

import { Request, Response } from 'express';

// LOGIN USER
export const login = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    // If not exists, create user (default role: DRIVER)
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'New User',
          phone,
          role: 'DRIVER',
        },
      });
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// VERIFY OTP
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    const otpHash = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const record = await prisma.whatsappOtp.findFirst({
      where: {
        phone,
        otpHash,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await prisma.whatsappOtp.update({
      where: { id: record.id },
      data: { verified: true },
    });

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await prisma.user.create({
        data: { name: 'New User', phone, role: 'DRIVER' },
      });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
