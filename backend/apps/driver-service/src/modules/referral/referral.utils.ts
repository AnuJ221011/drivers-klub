import { ApiError } from "@driversklub/common";
import { prisma } from "@driversklub/database";

/**
 * Generate a unique referral code
 * Format: REF_<random uppercase alphanumeric>
 */
export async function createUniqueReferralCode(): Promise<string> {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Generate a random alphanumeric code (8 characters)
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    const referralCode = `REF_${randomPart}`;

    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!existing) {
      return referralCode;
    }

    attempts++;
  }

  throw new ApiError(
    500,
    "Failed to generate unique referral code after multiple attempts"
  );
}
