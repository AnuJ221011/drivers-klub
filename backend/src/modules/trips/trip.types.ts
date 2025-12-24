import type { Ride } from "@prisma/client";

export type CreateTripInput = {
  assignmentId: string;
  pickup: string;
  drop?: string;
};

export type TripEntity = Ride;
