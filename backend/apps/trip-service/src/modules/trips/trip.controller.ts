import { Request, Response } from "express";
import { TripOrchestrator } from "../../core/trip/orchestrator/trip.orchestrator.js";
import { RideProviderMappingRepository } from "../../core/trip/repositories/ride-provider-mapping.repo.js";
import { prisma } from "@driversklub/database";
import { ApiResponse, logger } from "@driversklub/common";
import { MMTWebhook } from "../partner/mmt/mmt.webhook.js";
import { TripService } from "./trip.service.js";
import { GoogleMapsAdapter } from "../../adapters/providers/google/google.adapter.js";

export class TripController {
  private mmtWebhook = new MMTWebhook();
  private tripService = new TripService();
  private googleMaps = new GoogleMapsAdapter();

  constructor(
    private orchestrator: TripOrchestrator,
    private mappingRepo: RideProviderMappingRepository
  ) { }

  async createTrip(req: Request, res: Response) {
    try {
      const body = req.body ?? {};
      const pickupLocation = this.extractLocation(body.pickupLocation, {
        lat: this.normalizeCoordinate(body.pickupLat),
        lng: this.normalizeCoordinate(body.pickupLng),
      });
      const dropLocation = this.extractLocation(body.dropLocation, {
        lat: this.normalizeCoordinate(body.dropLat),
        lng: this.normalizeCoordinate(body.dropLng),
      });

      if (!pickupLocation.address || !dropLocation.address) {
        return res.status(400).json({
          message: "pickupLocation and dropLocation are required",
        });
      }

      const pickupTimeInput = body.pickupTime || body.tripDate;
      if (!pickupTimeInput) {
        return res.status(400).json({ message: "pickupTime is required" });
      }

      const pickupTime = new Date(pickupTimeInput);
      if (Number.isNaN(pickupTime.getTime())) {
        return res.status(400).json({ message: "pickupTime must be a valid datetime" });
      }

      let pickupAddress = pickupLocation.address;
      let pickupLat = pickupLocation.lat;
      let pickupLng = pickupLocation.lng;

      if (pickupLat === undefined || pickupLng === undefined) {
        const geocode = await this.googleMaps.getGeocode(pickupAddress);
        if (!geocode) {
          return res.status(400).json({ message: "Unable to geocode pickupLocation" });
        }
        pickupLat = geocode.lat;
        pickupLng = geocode.lng;
        pickupAddress = geocode.formattedAddress || pickupAddress;
      }

      let dropAddress = dropLocation.address;
      let dropLat = dropLocation.lat;
      let dropLng = dropLocation.lng;

      if (dropLat === undefined || dropLng === undefined) {
        const geocode = await this.googleMaps.getGeocode(dropAddress);
        if (!geocode) {
          return res.status(400).json({ message: "Unable to geocode dropLocation" });
        }
        dropLat = geocode.lat;
        dropLng = geocode.lng;
        dropAddress = geocode.formattedAddress || dropAddress;
      }

      const bookingTypeRaw = typeof body.bookingType === "string" ? body.bookingType.toUpperCase() : undefined;
      if (bookingTypeRaw && bookingTypeRaw !== "PREBOOK" && bookingTypeRaw !== "INSTANT") {
        return res.status(400).json({ message: "bookingType must be PREBOOK or INSTANT" });
      }

      const bookingType = bookingTypeRaw as "PREBOOK" | "INSTANT" | undefined;

      const tripTypeRaw =
        typeof body.tripType === "string" && body.tripType.trim()
          ? body.tripType.trim().toUpperCase()
          : bookingType === "INSTANT"
            ? "INTER_CITY"
            : "AIRPORT";

      if (!["AIRPORT", "INTER_CITY", "RENTAL"].includes(tripTypeRaw)) {
        return res.status(400).json({ message: "tripType must be AIRPORT, INTER_CITY, or RENTAL" });
      }

      const vehicleSku =
        typeof body.vehicleSku === "string" && body.vehicleSku.trim()
          ? body.vehicleSku.trim()
          : "TATA_TIGOR_EV";

      const { normalized: vehicleType, requestedVehicleType } =
        this.resolveVehicleType(body.vehicleType, vehicleSku);

      const passengerName =
        typeof body.passengerName === "string" ? body.passengerName.trim() : undefined;
      const passengerPhone =
        typeof body.passengerPhone === "string" ? body.passengerPhone.trim() : undefined;

      if ((passengerName && !passengerPhone) || (!passengerName && passengerPhone)) {
        return res.status(400).json({
          message: "passengerName and passengerPhone must be provided together",
        });
      }

      let distanceKm = this.normalizeCoordinate(body.distanceKm);
      if (distanceKm !== undefined && distanceKm <= 0) {
        distanceKm = undefined;
      }

      if (distanceKm === undefined) {
        let googleDistance = null;

        if (
          pickupLat !== undefined &&
          pickupLng !== undefined &&
          dropLat !== undefined &&
          dropLng !== undefined
        ) {
          googleDistance = await this.googleMaps.getDistance(
            { lat: pickupLat, lng: pickupLng },
            { lat: dropLat, lng: dropLng }
          );
        }

        if (!googleDistance) {
          googleDistance = await this.googleMaps.getDistance(
            pickupAddress,
            dropAddress
          );
        }

        if (googleDistance) {
          distanceKm = googleDistance.distanceKm;
        } else {
          return res.status(400).json({
            message: "Unable to calculate distance. Provide distanceKm or valid coordinates.",
          });
        }
      }

      const originCity =
        typeof body.originCity === "string" && body.originCity.trim()
          ? body.originCity.trim()
          : await this.googleMaps.getCityFromAddress(pickupAddress);

      if (!originCity) {
        return res.status(400).json({
          message: "Unable to determine origin city from pickupLocation",
        });
      }

      const destinationCity =
        typeof body.destinationCity === "string" && body.destinationCity.trim()
          ? body.destinationCity.trim()
          : (await this.googleMaps.getCityFromAddress(dropAddress)) || "Unknown";

      const bookingDate =
        typeof body.bookingDate === "string" && body.bookingDate.trim()
          ? body.bookingDate.trim()
          : new Date().toISOString();

      const tripInput = {
        distanceKm,
        bookingDate,
        tripDate: pickupTime.toISOString(),
        originCity,
        destinationCity,
        pickupLocation: pickupAddress,
        dropLocation: dropAddress,
        tripType: tripTypeRaw,
        vehicleSku,
        pickupLat,
        pickupLng,
        dropLat,
        dropLng,
        bookingType,
        vehicleType,
        requestedVehicleType,
        passengerName,
        passengerPhone,
      };

      const trip = await this.orchestrator.createTrip(tripInput);
      const response = {
        id: trip.id,
        pickupLocation: {
          address: trip.pickupLocation,
          latitude: trip.pickupLat,
          longitude: trip.pickupLng,
        },
        dropLocation: {
          address: trip.dropLocation,
          latitude: trip.dropLat,
          longitude: trip.dropLng,
        },
        pickupTime: trip.pickupTime?.toISOString?.() ?? trip.pickupTime,
        status: trip.status === "CREATED" ? "PENDING" : trip.status,
        estimatedFare: trip.price ?? 0,
        distance: trip.distanceKm,
      };

      return ApiResponse.send(res, 201, response, "Trip created successfully");
    } catch (error: any) {
      logger.error("[TripController] Create Trip Error:", error);
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  async getTrip(req: Request, res: Response) {
    try {
      const id = this.getParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Trip id is required" });
      }

      const trip = await prisma.ride.findUnique({
        where: { id },
      });

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const mapping = await this.mappingRepo.findByRideId(id);

      const mappedTrip = {
        ...trip,
        provider: mapping?.providerType,
      };
      return ApiResponse.send(res, 200, mappedTrip, "Trip retrieved successfully");
    } catch (error: any) {
      logger.error("[TripController] Get Trip Error:", error);
      return res.status(500).json({ message: "Failed to retrieve trip", error: error.message });
    }
  }

  async assignDriver(req: Request, res: Response) {
    try {
      const id = this.getParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Trip id is required" });
      }
      const { driverId } = req.body;

      const ride = await prisma.ride.findUnique({ where: { id } });
      if (!ride) return res.status(404).json({ message: "Trip not found" });

      // 1. Create Assignment
      await prisma.tripAssignment.create({
        data: {
          tripId: id,
          driverId: driverId,
          status: "ASSIGNED"
        }
      });

      // 2. Update Status
      const updated = await prisma.ride.update({
        where: { id },
        data: { status: "DRIVER_ASSIGNED" }
      });

      // 3. MMT Hook
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      const mapping = await this.mappingRepo.findByRideId(id);

      if (mapping && mapping.providerType === "MMT" && driver) {
        await this.mmtWebhook.pushDriverAssignment(mapping.externalBookingId, driver);
      }

      return ApiResponse.send(res, 200, updated, "Driver assigned successfully");
    } catch (error: any) {
      logger.error("[TripController] Assign Driver Error:", error);
      return res.status(500).json({ message: "Failed to assign driver", error: error.message });
    }
  }

  async startTrip(req: Request, res: Response) {
    try {
      const id = this.getParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Trip id is required" });
      }
      const { lat, lng } = req.body; // Expect location
      const userId = (req.user as any)?.id; // Need userId for auth

      // Use TripService for logic & auth
      const updated = await this.tripService.startTrip(id, userId);

      // MMT Hook (still needed here or move to Service?)
      // Keeping here for now to match pattern
      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushStartTrip(mapping.externalBookingId, lat || 0, lng || 0);
      }

      return ApiResponse.send(res, 200, updated, "Trip started successfully");
    } catch (error: any) {
      logger.error("[TripController] startTrip Error:", error);
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  async arriveTrip(req: Request, res: Response) {
    try {
      const id = this.getParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Trip id is required" });
      }
      const { lat, lng } = req.body;
      const userId = (req.user as any)?.id;

      await this.tripService.arriveTrip(id, userId, lat, lng);

      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushArrived(mapping.externalBookingId, lat || 0, lng || 0);
      }
      return ApiResponse.send(res, 200, { id, status: "ARRIVED_EVENT_SENT" }, "Driver marked as arrived");
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  async onboardTrip(req: Request, res: Response) {
    const id = this.getParam(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Trip id is required" });
    }
    const { otp } = req.body;

    const updated = await prisma.ride.update({
      where: { id },
      data: { status: "STARTED" } // Re-confirming start
    });

    const mapping = await this.mappingRepo.findByRideId(id);
    if (mapping && mapping.providerType === "MMT") {
      await this.mmtWebhook.pushOnboard(mapping.externalBookingId, otp || "0000");
    }
    return ApiResponse.send(res, 200, updated, "Passenger boarded");
  }

  async noShowTrip(req: Request, res: Response) {
    try {
      const id = this.getParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Trip id is required" });
      }
      const userId = (req.user as any)?.id;

      const updated = await this.tripService.noShowTrip(id, userId);

      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushNoShow(mapping.externalBookingId);
      }
      return ApiResponse.send(res, 200, updated, "Trip marked as No Show");
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  async completeTrip(req: Request, res: Response) {
    try {
      const id = this.getParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Trip id is required" });
      }
      const { distance, fare } = req.body;
      const userId = (req.user as any)?.id;

      // Use TripService
      const updated = await this.tripService.completeTrip(id, userId, fare);

      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushComplete(mapping.externalBookingId, distance || 0, fare || 0);
      }

      return ApiResponse.send(res, 200, updated, "Trip completed successfully");
    } catch (error: any) {
      logger.error("[TripController] completeTrip Error:", error);
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  async getDriverTrips(req: Request, res: Response) {
    const { id: userId, role } = req.user as any;
    const { status } = req.query; // Support filtering (e.g. ?status=COMPLETED)

    if (role !== "DRIVER") {
      return res.status(403).json({ message: "Only drivers can access this endpoint" });
    }

    const driver = await prisma.driver.findFirst({ where: { userId } });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    let statusFilter = {};
    if (status === "HISTORY") {
      statusFilter = { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] };
    } else {
      // Default to active
      statusFilter = { in: ["DRIVER_ASSIGNED", "STARTED"] };
    }

    const trips = await prisma.ride.findMany({
      where: {
        tripAssignments: {
          some: {
            driverId: driver.id,
            status: "ASSIGNED"
          }
        },
        status: statusFilter
      },
      include: {
        tripAssignments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return ApiResponse.send(res, 200, trips, "Trips retrieved");
  }

  async getTracking(req: Request, res: Response) {
    const id = this.getParam(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Trip id is required" });
    }

    const mapping = await this.mappingRepo.findByRideId(id);
    if (!mapping) {
      return res.status(404).json({ message: "Tracking not available" });
    }

    const provider = (this.orchestrator as any)["registry"].get(
      mapping.providerType
    );

    const tracking = await provider.trackRide({
      bookingId: mapping.externalBookingId,
    });

    return ApiResponse.send(res, 200, {
      source: tracking.data.source,
      destination: tracking.data.destination,
      live: tracking.data.live,
    }, "Tracking data retrieved successfully");
  }

  async updateLocation(req: Request, res: Response) {
    try {
      const id = this.getParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Trip id is required" });
      }
      const { lat, lng } = req.body;

      // Validate input
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and Longitude are required" });
      }

      // We could persist this location to a RideLocationHistory table here if needed.
      // For now, we just foward it to the provider.

      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushUpdateLocation(mapping.externalBookingId, lat, lng);
      }

      return ApiResponse.send(res, 200, null, "Location updated successfully");
    } catch (error: any) {
      logger.error("[TripController] updateLocation Error:", error);
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  private normalizeCoordinate(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return undefined;
  }

  private extractLocation(
    raw: unknown,
    fallback?: { lat?: number; lng?: number }
  ): { address?: string; lat?: number; lng?: number } {
    let address: string | undefined;
    let lat = fallback?.lat;
    let lng = fallback?.lng;

    if (typeof raw === "string") {
      address = raw;
    } else if (raw && typeof raw === "object") {
      const data = raw as Record<string, unknown>;
      if (typeof data.address === "string") {
        address = data.address;
      } else if (typeof data.description === "string") {
        address = data.description;
      }

      const extractedLat = this.normalizeCoordinate(data.latitude ?? data.lat);
      const extractedLng = this.normalizeCoordinate(data.longitude ?? data.lng);
      if (extractedLat !== undefined) lat = extractedLat;
      if (extractedLng !== undefined) lng = extractedLng;
    }

    return { address, lat, lng };
  }

  private resolveVehicleType(
    requested: unknown,
    vehicleSku: string
  ): { normalized: "EV" | "NON_EV"; requestedVehicleType?: string } {
    if (typeof requested === "string" && requested.trim()) {
      const trimmed = requested.trim();
      const upper = trimmed.toUpperCase();
      if (upper === "EV" || upper === "NON_EV") {
        return { normalized: upper as "EV" | "NON_EV" };
      }
      return { normalized: "NON_EV", requestedVehicleType: trimmed };
    }

    return {
      normalized: vehicleSku.toUpperCase().includes("EV") ? "EV" : "NON_EV",
    };
  }

  private getParam(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
