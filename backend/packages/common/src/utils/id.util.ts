import { PrismaClient } from "@prisma/client";

export enum EntityType {
  USER = "USR",
  DRIVER = "DRV",
  HUB_MANAGER = "MGR",
  FLEET = "FLT",
  VEHICLE = "VEH",
  HUB = "HUB",
  TRIP = "TRP",
  BOOKING = "BKS",
  ATTENDANCE = "ATT",
  TRANSACTION = "TXN",
  PAYOUT = "PAY",
  INCENTIVE = "INC",
  PENALTY = "PEN",
  RENTAL_PLAN = "PLN",
  COLLECTION = "COL",
  REFERRAL = "REF",
  ASSIGNMENT = "ASN",
  DRIVER_RENTAL = "RTL",
  RIDE_PROVIDER_MAPPING = "RPM",
  PREFERENCE_DEFINITION = "PFD",
  DRIVER_PREFERENCE_REQUEST = "DPR",
  DRIVER_PREFERENCE = "DPF",
  VIRTUAL_QR = "VQR",
  RENTAL_PAYMENT = "RTP",
  TRIP_ASSIGNMENT = "TAS",
  BREAK = "BRK",
}

export class IdUtils {
  /**
   * Generates a custom short ID in the format [PREFIX][YYYYMMDD][SERIAL]
   * Ensures atomicity using Prisma's upsert mechanism.
   */
  static async generateShortId(
    prisma: any, // Use 'any' or a broad Prisma type to avoid circular dependency issues
    entity: EntityType,
    dateOverride?: Date
  ): Promise<string> {
    const now = dateOverride || new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

    // We use a raw SQL approach or a specialized tracker table
    // IdSequence { entity: string, date: string, lastValue: int }

    const sequence = await (prisma as PrismaClient).idSequence.upsert({
      where: {
        entity_date: {
          entity: entity,
          date: dateStr,
        },
      },
      update: {
        lastValue: {
          increment: 1,
        },
      },
      create: {
        entity: entity,
        date: dateStr,
        lastValue: 1,
      },
    });

    const serialStr = sequence.lastValue.toString().padStart(3, "0");
    return `${entity}${dateStr}${serialStr}`;
  }
}
