import { AssignmentService } from "./assignment.service.js";

const service = new AssignmentService();

export const createAssignment = async (req: any, res: any) => {
  const assignment = await service.createAssignment(req.body);
  res.status(201).json(assignment);
};

export const getAssignmentsByFleet = async (req: any, res: any) => {
  const list = await service.getAssignmentsByFleet(req.params.fleetId);
  res.json(list);
};

export const endAssignment = async (req: any, res: any) => {
  const assignment = await service.endAssignment(req.params.id);
  res.json(assignment);
};
