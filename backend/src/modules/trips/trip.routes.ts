import { Router } from "express";
import { TripController } from "./trip.controller.js";
import { TripOrchestrator } from "../../core/trip/orchestrator/trip.orchestrator.js";
import { RideProviderMappingRepository } from "../../core/trip/repositories/ride-provider-mapping.repo.js";
import { TripAllocationService } from "../../core/trip/services/trip-allocation.service.js";

import { ProviderRegistry } from "../../core/trip/orchestrator/provider.registry.js";
import { InternalRideProvider } from "../../adapters/providers/internal/internal.adapter.js";
import { MojoBoxxAdapter } from "../../adapters/providers/mojoboxx/mojoboxx.adapter.js";
import { ProviderType } from "../../shared/enums/provider.enum.js";

import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

// Secure all trip routes
router.use(authenticate);

const registry = new ProviderRegistry();
registry.register(ProviderType.INTERNAL, new InternalRideProvider());
registry.register(ProviderType.MOJOBOXX, new MojoBoxxAdapter());

const allocationService = new TripAllocationService();

const mappingRepo = new RideProviderMappingRepository();

const orchestrator = new TripOrchestrator(
  allocationService,
  registry,
  mappingRepo
);

const tripController = new TripController(orchestrator, mappingRepo);

router.post("/", (req, res) => tripController.createTrip(req, res));
router.get("/", (req, res) => tripController.getDriverTrips(req, res));
router.get("/:id", (req, res) => tripController.getTrip(req, res));
router.post("/:id/assign", (req, res) => tripController.assignDriver(req, res));
router.post("/:id/start", (req, res) => tripController.startTrip(req, res));
router.post("/:id/arrived", (req, res) => tripController.arriveTrip(req, res));
router.post("/:id/onboard", (req, res) => tripController.onboardTrip(req, res));
router.post("/:id/noshow", (req, res) => tripController.noShowTrip(req, res));
router.post("/:id/complete", (req, res) => tripController.completeTrip(req, res));
router.get("/:id/tracking", (req, res) => tripController.getTracking(req, res));
router.post("/:id/location", (req, res) => tripController.updateLocation(req, res));

export default router;
