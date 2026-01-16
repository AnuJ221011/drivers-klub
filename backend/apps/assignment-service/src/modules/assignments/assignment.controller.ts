import { AssignmentService } from "./assignment.service.js";
import { ApiResponse } from "@driversklub/common";

const service = new AssignmentService();

export const createAssignment = async (req: any, res: any) => {
  const assignment = await service.createAssignment(req.body, req.user);
  ApiResponse.send(res, 201, assignment, "Assignment created successfully");
};

export const getAssignmentsByFleet = async (req: any, res: any) => {
  const list = await service.getAssignmentsByFleet(req.params.fleetId, req.user);
  ApiResponse.send(res, 200, list, "Assignments retrieved successfully");
};

export const getAssignmentsByTrip = async (req: any, res: any) => {
  const list = await service.getAssignmentsByTrip(req.params.tripId, req.user);
  ApiResponse.send(res, 200, list, "Trip assignments retrieved successfully");
};

export const endAssignment = async (req: any, res: any) => {
  const assignment = await service.endAssignment(req.params.id, req.user);
  ApiResponse.send(res, 200, assignment, "Assignment ended successfully");
};