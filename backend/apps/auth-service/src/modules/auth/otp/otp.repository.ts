import { prisma } from "@driversklub/database";

export class OtpRepository {
  async invalidateOld(phone: string) {
    await prisma.otp.updateMany({
      where: { phone, verified: false },
      data: { verified: true }
    });
  }

  async create(data: {
    phone: string;
    otp: string;
    expiresAt: Date;
  }) {
    return prisma.otp.create({ data });
  }

  async findActive(phone: string) {
    return prisma.otp.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async markVerified(id: string) {
    return prisma.otp.update({
      where: { id },
      data: { verified: true }
    });
  }

  async incrementAttempts(id: string) {
    return prisma.otp.update({
      where: { id },
      data: { attempts: { increment: 1 } }
    });
  }

  async deleteOtp(id: string) {
    return prisma.otp.delete({
      where: { id }
    });
  }
}
