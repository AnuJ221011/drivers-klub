export interface CreateTripRequest {
  /**
   * When present, the trip will be scoped to a fleet and can be queried by fleet.
   * This is used by the Admin dashboard to view trips fleet-wise.
   */
  fleetId?: string;
  distanceKm: number;
  bookingDate: string;
  tripDate: string;
  originCity: string;
  destinationCity?: string;
  tripType: "AIRPORT";
  vehicleSku: "TATA_TIGOR_EV";
}
