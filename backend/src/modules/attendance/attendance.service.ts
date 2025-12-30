 import { prisma } from "@/utils/prisma.js";
import { GeoUtils } from "../../utils/geo.util.js";

 export const checkGeoLocation = async (
    driverId: string,
    lat: number,
    lng: number,
    radiusInMeters: number = 500
  ): Promise<boolean> => {
    try {
      // Fetch driver with hub information
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { hubId: true },
      });

      if (!driver || !driver.hubId) {
        return false;
      }

      // Fetch hub location
      const hub = await prisma.fleetHub.findUnique({
        where: { id: driver.hubId },
        select: { location: true },
      });

      if (!hub || !hub.location) {
        return false;
      }

      // Extract lat/lng from location JSON
      const location = hub.location as { lat: number; lng: number };
      if (!location.lat || !location.lng) {
        return false;
      }

      // Check if driver is within geofence radius
      return GeoUtils.isWithinGeofence(
        lat,
        lng,
        location.lat,
        location.lng,
        radiusInMeters
      );
    } catch (error) {
      console.error("Error checking geolocation:", error);
      return false;
    }
  }