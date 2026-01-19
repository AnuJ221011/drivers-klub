export type CreateFleetManagerInput = {
  name: string;
  mobile: string; // maps to User.phone
  city: string; 
  profilePicture?: string; // kept for compatibility (not stored on User)
  fleetId: string;
};

export type FleetManagerStatus = "ACTIVE" | "INACTIVE";

export type FleetManagerEntity = {
  id: string;
  name: string;
  mobile: string;
  city: string;
  profilePicture?: string | null;
  fleetId: string;
  status: FleetManagerStatus;
  createdAt: Date;
  updatedAt: Date;
};

