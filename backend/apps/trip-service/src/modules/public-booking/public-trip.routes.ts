import { Router } from "express";
import { PublicTripController } from "./public-trip.controller.js";
import { TripOrchestrator } from "../../core/trip/orchestrator/trip.orchestrator.js";
import { RideProviderMappingRepository } from "../../core/trip/repositories/ride-provider-mapping.repo.js";
import { TripAllocationService } from "../../core/trip/services/trip-allocation.service.js";
import { ProviderRegistry } from "../../core/trip/orchestrator/provider.registry.js";
import { MojoBoxxAdapter } from "../../adapters/providers/mojoboxx/mojoboxx.adapter.js";
import { MMTAdapter } from "../../adapters/providers/mmt/mmt.adapter.js";
import { RapidoAdapter } from "../../adapters/providers/rapido/rapido.adapter.js";
import { ProviderType } from "@prisma/client";

const router = Router();

// Initialize orchestrator (same setup as regular trip routes)
const registry = new ProviderRegistry();
registry.register(ProviderType.MOJOBOXX, new MojoBoxxAdapter());
registry.register(ProviderType.MMT, new MMTAdapter());
registry.register(ProviderType.RAPIDO, new RapidoAdapter());

const allocationService = new TripAllocationService();
const mappingRepo = new RideProviderMappingRepository();

const orchestrator = new TripOrchestrator(
  allocationService,
  registry,
  mappingRepo
);

const publicTripController = new PublicTripController(orchestrator);

// Public routes - no authentication required
router.post("/pricing", (req, res) => publicTripController.getPricing(req, res));
router.post("/create", (req, res) => publicTripController.createTrip(req, res));

export default router;