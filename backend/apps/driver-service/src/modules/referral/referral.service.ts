import { ApiError } from "@driversklub/common";
import { ReferralRepository } from "./referral.repository.js";
import { createUniqueReferralCode } from "./referral.utils.js";

import {
  AttendanceStatus,
  AssignmentStatus,
  ReferralStatus,
  User,
} from "@prisma/client";
import { prisma } from "@driversklub/database";
import { getReferralConfig } from "./referral.config.js";

export class ReferralService {
  private referralRepository = new ReferralRepository();

  /**
   * Validates a referral code and returns the referrer user if valid.
   * Checks if the code exists, is active, and hasn't exceeded the usage limit.
   *
   * @param referralCode - The referral code to validate
   * @returns The user who owns the referral code
   * @throws ApiError if the referral code is invalid, inactive, or limit reached
   */
  async validateAndGetReferrer(referralCode: string): Promise<User> {
    if (!referralCode || referralCode.trim().length === 0) {
      throw new ApiError(400, "Referral code is required");
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.trim() },
    });

    if (!referrer) {
      throw new ApiError(400, "Invalid referral code");
    }

    if (!referrer.isActive) {
      throw new ApiError(400, "Referral code belongs to an inactive account");
    }

    const config = getReferralConfig();
    const referralCount = await prisma.referral.count({
      where: {
        referredById: referrer.id,
      },
    });

    if (referralCount >= config.maxReferralsPerDriver) {
      throw new ApiError(
        409,
        `Referral code has reached the maximum usage limit of ${config.maxReferralsPerDriver} referrals`
      );
    }

    return referrer;
  }

  /**
   * Creates a referral record linking a referred user to their referrer.
   *
   * @param referrerId - The ID of the user who provided the referral code
   * @param referredUserId - The ID of the user who was referred
   * @throws ApiError if the referral record creation fails
   */
  async createReferralRecord(
    referrerId: string,
    referredUserId: string
  ): Promise<void> {
    if (referrerId === referredUserId) {
      throw new ApiError(400, "A user cannot refer themselves");
    }

    try {
      await this.referralRepository.createReferralRecord(
        referrerId,
        referredUserId
      );
    } catch (error: any) {
      // Check if it's a unique constraint violation (user already referred)
      if (error?.code === "P2002") {
        throw new ApiError(409, "This user has already been referred");
      }
      throw error;
    }
  }

  /**
   * Ensures a user has a referral code assigned.
   * If the user already has a referral code, returns it.
   * Otherwise, generates and assigns a new unique referral code.
   *
   * @param userId - The ID of the user to assign a referral code to
   * @returns The user's referral code (existing or newly generated)
   * @throws ApiError if the user is not found
   */
  async ensureUserHasReferralCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.referralCode) {
      return user.referralCode;
    }

    const referralCode = await createUniqueReferralCode();
    await this.referralRepository.assignReferralCode(userId, referralCode);

    return referralCode;
  }

  /**
   * Gets the count of referrals made by a specific user.
   *
   * @param userId - The ID of the user
   * @returns The number of referrals made by the user
   */
  async getReferralCount(userId: string): Promise<number> {
    return prisma.referral.count({
      where: {
        referredById: userId,
      },
    });
  }

  /**
   * Gets the number of active days for a driver
   * An active day is defined as a day with approved or checked-out attendance
   *
   * @param driverId - The ID of the driver
   * @returns The number of active days
   */
  async getActiveDaysCount(driverId: string): Promise<number> {
    const attendances = await prisma.attendance.findMany({
      where: {
        driverId,
        status: {
          in: [AttendanceStatus.APPROVED, AttendanceStatus.CHECKED_OUT],
        },
      },
      select: {
        checkInTime: true,
      },
    });

    // Count unique days (by date, not datetime)
    const uniqueDays = new Set<string>();
    attendances.forEach((attendance) => {
      const dateKey = attendance.checkInTime.toISOString().split("T")[0];
      uniqueDays.add(dateKey);
    });

    return uniqueDays.size;
  }

  /**
   * Gets the average number of rides per day for a driver
   * Only counts completed trips
   *
   * @param driverId - The ID of the driver
   * @returns The average rides per day
   */
  async getAverageRidesPerDay(driverId: string): Promise<number> {
    const completedAssignments = await prisma.tripAssignment.findMany({
      where: {
        driverId,
        status: AssignmentStatus.COMPLETED,
      },
      include: {
        trip: {
          select: {
            completedAt: true,
          },
        },
      },
    });

    if (completedAssignments.length === 0) {
      return 0;
    }

    // Filter out assignments without completed trips
    const assignmentsWithCompletedTrips = completedAssignments.filter(
      (assignment) => assignment.trip?.completedAt
    );

    if (assignmentsWithCompletedTrips.length === 0) {
      return 0;
    }

    // Count unique days
    const uniqueDays = new Set<string>();
    assignmentsWithCompletedTrips.forEach((assignment) => {
      if (assignment.trip?.completedAt) {
        const dateKey = assignment.trip.completedAt.toISOString().split("T")[0];
        uniqueDays.add(dateKey);
      }
    });

    const totalDays = uniqueDays.size || 1; // Avoid division by zero
    return assignmentsWithCompletedTrips.length / totalDays;
  }

  /**
   * Checks if a referred driver is eligible for referral reward
   * Eligibility criteria:
   * - At least N days active (configurable, default 30)
   * - Average of at least M rides per day (configurable, default 8)
   *
   * @param referredUserId - The ID of the referred user
   * @returns Object with eligibility status and details
   */
  async checkReferralEligibility(referredUserId: string): Promise<{
    isEligible: boolean;
    activeDays: number;
    averageRidesPerDay: number;
    minActiveDays: number;
    minRidesPerDay: number;
    message?: string;
  }> {
    const config = getReferralConfig();

    // Get driver for the referred user
    const driver = await prisma.driver.findUnique({
      where: { userId: referredUserId },
    });

    if (!driver) {
      return {
        isEligible: false,
        activeDays: 0,
        averageRidesPerDay: 0,
        minActiveDays: config.minActiveDays,
        minRidesPerDay: config.minRidesPerDay,
        message: "Driver not found",
      };
    }

    const activeDays = await this.getActiveDaysCount(driver.id);
    const averageRidesPerDay = await this.getAverageRidesPerDay(driver.id);

    const isEligible =
      activeDays >= config.minActiveDays &&
      averageRidesPerDay >= config.minRidesPerDay;

    let message = "";
    if (isEligible) {
      message = "Driver is eligible for referral reward";
    } else {
      const needsDays = Math.max(0, config.minActiveDays - activeDays);
      const needsRides = Math.max(
        0,
        config.minRidesPerDay - averageRidesPerDay
      );
      const parts: string[] = [];
      if (needsDays > 0) {
        parts.push(`${needsDays} more active day${needsDays > 1 ? "s" : ""}`);
      }
      if (needsRides > 0) {
        parts.push(
          `${needsRides.toFixed(1)} more ride${needsRides > 1 ? "s" : ""} per day`
        );
      }
      message = `Driver needs ${parts.join(" and ")}`;
    }

    return {
      isEligible,
      activeDays,
      averageRidesPerDay,
      minActiveDays: config.minActiveDays,
      minRidesPerDay: config.minRidesPerDay,
      message,
    };
  }

  /**
   * Processes referral reward for a successful referral
   * Creates an incentive for the referrer and updates referral status
   *
   * @param referralId - The ID of the referral record
   * @returns The created incentive
   * @throws ApiError if referral is not found, already rewarded, or driver not eligible
   */
  async processReferralReward(referralId: string): Promise<any> {
    const config = getReferralConfig();

    // Get referral record
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        referredBy: {
          include: {
            driver: true,
          },
        },
        referredTo: {
          include: {
            driver: true,
          },
        },
      },
    });

    if (!referral) {
      throw new ApiError(404, "Referral not found");
    }

    if (referral.status === ReferralStatus.COMPLETED) {
      throw new ApiError(400, "Referral reward has already been processed");
    }

    if (referral.status !== ReferralStatus.PENDING) {
      throw new ApiError(
        400,
        `Cannot process reward for referral with status ${referral.status}`
      );
    }

    // Check eligibility
    const eligibility = await this.checkReferralEligibility(
      referral.referredToId
    );

    if (!eligibility.isEligible) {
      throw new ApiError(
        400,
        `Referred driver is not eligible for reward: ${eligibility.message}`
      );
    }

    // Get referrer driver
    const referrerDriver = referral.referredBy.driver;

    if (!referrerDriver) {
      throw new ApiError(404, "Referrer driver not found");
    }

    // Create incentive for referrer
    const incentive = await prisma.incentive.create({
      data: {
        driverId: referrerDriver.id,
        amount: config.rewardAmount,
        reason: `Referral reward for referring driver ${referral.referredTo.driver?.firstName || referral.referredToId}`,
        category: "REFERRAL",
        createdBy: "SYSTEM", // System-generated incentive
        isPaid: false,
      },
    });

    // Update referral status
    await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: ReferralStatus.COMPLETED,
        rewardedAt: new Date(),
      },
    });

    return incentive;
  }

  /**
   * Checks and processes all eligible referral rewards
   * Can be called manually or via cron job
   *
   * @returns Summary of processed referrals
   */
  async checkAndProcessEligibleReferrals(): Promise<{
    total: number;
    processed: number;
    skipped: number;
    errors: Array<{ referralId: string; error: string }>;
  }> {
    const pendingReferrals = await prisma.referral.findMany({
      where: {
        status: ReferralStatus.PENDING,
      },
      include: {
        referredTo: {
          include: {
            driver: true,
          },
        },
      },
    });

    const result = {
      total: pendingReferrals.length,
      processed: 0,
      skipped: 0,
      errors: [] as Array<{ referralId: string; error: string }>,
    };

    for (const referral of pendingReferrals) {
      try {
        // Skip if referred user doesn't have a driver profile
        if (!referral.referredTo.driver) {
          result.skipped++;
          continue;
        }

        // Check eligibility
        const eligibility = await this.checkReferralEligibility(
          referral.referredToId
        );

        if (eligibility.isEligible) {
          // Process reward
          await this.processReferralReward(referral.id);
          result.processed++;
        } else {
          result.skipped++;
        }
      } catch (error: any) {
        result.errors.push({
          referralId: referral.id,
          error: error.message || "Unknown error",
        });
      }
    }

    return result;
  }
}
