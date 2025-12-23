export interface CreateTripRequest {
  distanceKm: number;
  bookingDate: string;
  tripDate: string;
  originCity: string;
  tripType: "AIRPORT";
  vehicleSku: "TATA_TIGOR_EV";
}
