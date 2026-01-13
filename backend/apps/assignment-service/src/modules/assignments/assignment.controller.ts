import { AssignmentService } from "./assignment.service.js";
import { ApiResponse } from "@driversklub/common";

const service = new AssignmentService();

export const createAssignment = async (req: any, res: any) => {
  const assignment = await service.createAssignment(req.body);
  ApiResponse.send(res, 201, assignment, "Assignment created successfully");
};

export const getAssignmentsByFleet = async (req: any, res: any) => {
  const list = await service.getAssignmentsByFleet(req.params.fleetId);
  ApiResponse.send(res, 200, list, "Assignments retrieved successfully");
};

export const getAssignmentsByTrip = async (req: any, res: any) => {
  const list = await service.getAssignmentsByTrip(req.params.tripId);
  ApiResponse.send(res, 200, list, "Trip assignments retrieved successfully");
};

export const endAssignment = async (req: any, res: any) => {
  const assignment = await service.endAssignment(req.params.id);
  ApiResponse.send(res, 200, assignment, "Assignment ended successfully");
};