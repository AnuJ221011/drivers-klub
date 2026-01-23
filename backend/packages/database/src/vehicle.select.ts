import type { Prisma } from "@prisma/client";

export const vehicleSelect = {
  id: true,
  fleetId: true,
  hubId: true,
  vehicleNumber: true,
  vehicleName: true,
  vehicleModel: true,
  vehicleColor: true,
  ownership: true,
  ownerName: true,
  fuelType: true,
  rcFrontImage: true,
  rcBackImage: true,
  permitImage: true,
  permitExpiry: true,
  fitnessImage: true,
  fitnessExpiry: true,
  insuranceImage: true,
  insuranceExpiry: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VehicleSelect;

export type VehicleRow = Prisma.VehicleGetPayload<{
  select: typeof vehicleSelect;
}>;
