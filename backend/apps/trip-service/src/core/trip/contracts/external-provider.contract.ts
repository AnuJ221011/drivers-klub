import { FareOption } from "./fare.contract.js";
import { ExternalBooking } from "./booking.contract.js";

export interface ExternalRideProvider {
  searchFare(input: any): Promise<FareOption[]>;
  prebook(input: any): Promise<ExternalBooking>;
  confirmPayment(input: any): Promise<void>;
  cancelBooking(input: any): Promise<void>;
  getBookingDetails(input: any): Promise<any>;
  trackRide(input: any): Promise<any>;
  getRideStatus(providerBookingId: string): Promise<string>;
}
