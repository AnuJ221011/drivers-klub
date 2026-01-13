import { HubManager } from "@prisma/client";

export type CreateHubManagerInput = {
  name: string;
  mobile: string;
  city: string;
  profilePicture?: string;
};

export type HubManagerEntity = HubManager;
