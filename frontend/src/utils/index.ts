export type Vehicle = {
  id: string;
  number: string;
  brand: string;
  model: string;
  bodyType: string;
  fuelType: string;
  status: "Active" | "Inactive";
};




export type DriverStatus = "Active" | "Inactive";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  rating?: number;
}
