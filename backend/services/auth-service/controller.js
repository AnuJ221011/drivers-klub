import prisma from '../../shared/prisma.js';
import { generateToken } from '../../shared/jwt.js';
import crypto from 'crypto';
import axios from 'axios';

// LOGIN USER
export const login = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Send OTP via notification-service (WhatsApp with SMS fallback)
    const notificationBaseUrl =
      process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';

    await axios.post(`${notificationBaseUrl}/notifications/send-otp`, { phone });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to send OTP';
    res.status(500).json({ message: msg });
  }
};


// VERIFY OTP
export const verifyOtp = async (req, res) => {
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
