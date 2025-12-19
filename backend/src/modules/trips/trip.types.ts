import type { Trip} from "@prisma/client";

export type CreateTripInput = {
  assignmentId: string;
  pickup: string;
  drop?: string;
};

export type TripEntity = Trip;
