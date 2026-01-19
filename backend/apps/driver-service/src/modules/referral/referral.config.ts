/**
 * Referral System Configuration
 *
 * These values can be made configurable via database (PreferenceDefination) or environment variables
 * For now, using constants with defaults as per requirements
 */

export interface ReferralConfig {
  /** Maximum number of referrals a driver can make */
  maxReferralsPerDriver: number;

  /** Reward amount (in rupees) given to referrer on successful referral */
  rewardAmount: number;

  /** Minimum number of active days required for referral to be considered successful */
  minActiveDays: number;

  /** Minimum number of rides per day required (average) */
  minRidesPerDay: number;
}

/**
 * Default referral configuration values
 */
export const DEFAULT_REFERRAL_CONFIG: ReferralConfig = {
  maxReferralsPerDriver: 5, // Changed from 3 to 5
  rewardAmount: 500, // Rs 500
  minActiveDays: 30, // 30 days
  minRidesPerDay: 8, // 8 rides per day
};

/**
 * Get referral configuration
 * In the future, this can fetch from database (PreferenceDefination) or environment variables
 */
export function getReferralConfig(): ReferralConfig {
  // TODO: Make this configurable via database or env vars
  return DEFAULT_REFERRAL_CONFIG;
}
