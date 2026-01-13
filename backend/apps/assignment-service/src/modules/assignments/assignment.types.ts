import type { Assignment, AssignmentStatus } from "@prisma/client";

export type CreateAssignmentInput = {
  fleetId: string;
  driverId: string;
  vehicleId: string;
};

export type EndAssignmentInput = {
  status: AssignmentStatus;
  endTime: Date;
};

export type AssignmentEntity = Assignment;
