import { prisma } from "@driversklub/database";


export class ReferralRepository {
  /**
   * Creates a referral record in the database
   *
   * @param referredById - The ID of the user who provided the referral code
   * @param referredToId - The ID of the user who was referred
   * @returns The created referral record
   */
  async createReferralRecord(referredById: string, referredToId: string) {
    return prisma.referral.create({
      data: {
        referredById,
        referredToId,
      },
    });
  }

  /**
   * Assigns a referral code to a user
   *
   * @param userId - The ID of the user
   * @param referralCode - The referral code to assign
   * @returns The updated user record
   */
  async assignReferralCode(userId: string, referralCode: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { referralCode },
    });
  }
}
