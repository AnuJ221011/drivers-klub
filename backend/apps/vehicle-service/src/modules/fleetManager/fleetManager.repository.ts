import { prisma } from "@driversklub/database";
import type {
  CreateFleetManagerInput,
  FleetManagerEntity
} from "./fleetManager.types.js";

export class FleetManagerRepository {
  async create(data: CreateFleetManagerInput): Promise<FleetManagerEntity> {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.mobile,
        role: "MANAGER",
        fleetId: data.fleetId,
        hubIds: [],
        isActive: true,
      },
      include: { fleet: { select: { city: true } } },
    });

    return {
      id: user.id,
      name: user.name,
      mobile: user.phone,
      city: user.fleet?.city || "",
      profilePicture: null,
      fleetId: user.fleetId || data.fleetId,
      status: user.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByFleet(fleetId: string): Promise<FleetManagerEntity[]> {
    const users = await prisma.user.findMany({
      where: { role: { in: ["MANAGER", "FLEET_ADMIN"] }, fleetId },
      include: { fleet: { select: { city: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      mobile: u.phone,
      role: u.role,
      city: u.fleet?.city || "",
      profilePicture: null,
      fleetId: u.fleetId || fleetId,
      status: u.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }

  async findById(id: string): Promise<FleetManagerEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { fleet: { select: { city: true } } },
    });
    if (!user || user.role !== "MANAGER" || !user.fleetId) return null;

    return {
      id: user.id,
      name: user.name,
      mobile: user.phone,
      city: user.fleet?.city || "",
      profilePicture: null,
      fleetId: user.fleetId,
      status: user.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByMobile(mobile: string): Promise<FleetManagerEntity | null> {
    const user = await prisma.user.findUnique({
      where: { phone: mobile },
      include: { fleet: { select: { city: true } } },
    });
    if (!user || !["MANAGER", "FLEET_ADMIN"].includes(user.role) || !user.fleetId) return null;

    return {
      id: user.id,
      name: user.name,
      mobile: user.phone,
      city: user.fleet?.city || "",
      profilePicture: null,
      fleetId: user.fleetId,
      status: user.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async deactivate(id: string): Promise<FleetManagerEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: { fleet: { select: { city: true } } },
    });

    return {
      id: user.id,
      name: user.name,
      mobile: user.phone,
      city: user.fleet?.city || "",
      profilePicture: null,
      fleetId: user.fleetId || "",
      status: user.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}