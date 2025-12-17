import crypto from 'crypto';
import prisma from '../../shared/prisma.js';
import { sendWhatsappOtp, sendSmsOtp } from './exotel.js';

import { Request, Response } from 'express';

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.whatsappOtp.create({
      data: {
        phone,
        otpHash,
        expiresAt,
      },
    });

    try {
      await sendWhatsappOtp(phone, otp);
    } catch (err) {
      // fallback to SMS
      await sendSmsOtp(phone, otp);
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
