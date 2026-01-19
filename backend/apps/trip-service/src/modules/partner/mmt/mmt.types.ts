export interface MMTSearchResponse {
    response: {
        distance_booked: number;
        is_instant_search: boolean;
        is_instant_available: boolean;
        start_time: string;
        is_part_payment_allowed: boolean;
        communication_type: "PRE" | "KIOSK";
        verification_type: "OTP" | "QR" | "NA";
        airport_tags?: string[];
        car_types: MMTCarType[];
    };
    error?: string;
    code?: string;
}

export interface MMTCarType {
    sku_id: string;
    type: string; // hatchback, sedan, suv, etc.
    subcategory: string; // basic, plus, premium
    combustion_type: string; // Petrol, Diesel, Electric, CNG, Unknown
    model: string;
    carrier: boolean;
    make_year_type: string; // Newer, Older, Unknown
    make_year?: number;
    cancellation_rule: string;
    zero_payment?: boolean;
    min_payment_percentage?: number;
    amenities?: {
        features: {
            vehicle: string[];
            driver: string[];
            services: string[];
        };
    };
    travel_add_ons?: {
        name: string;
        value: string | null;
        price: number;
    }[];
    pax_capacity?: number;
    luggage_capacity?: number;
    fare_details: MMTFareDetails;
    expressway_fare_details?: {
        per_km_charge: number;
        extra_toll_charge: number;
    };
}

export interface MMTBlockResponse {
    response: {
        success: boolean;
        order_reference_number: string;
        verification_code?: string;
        status: string;
        error?: string;
    };
}

export interface MMTConfirmPaidResponse {
    response: {
        success: boolean;
        order_reference_number: string;
        status: string;
    };
}

export interface MMTCancelResponse {
    response: {
        success: boolean;
        error?: string;
    };
}

export interface MMTFareDetails {
    base_fare: number;
    per_km_charge: number;
    per_km_extra_charge: number;
    total_driver_charges: number;
    seller_discount?: number;
    driver_charge_per_day?: number;
    min_km_per_day?: number;
    total_days_charged?: number;
    extra_charges: {
        night_charges?: MMTChargeComponent;
        toll_charges?: MMTChargeComponent;
        state_tax?: MMTChargeComponent;
        parking_charges?: MMTChargeComponent;
        waiting_charges?: MMTWaitingChargeComponent;
        airport_entry_fee?: MMTChargeComponent;
        service_charges?: MMTChargeComponent;
        airport_toll?: MMTChargeComponent;
    };
    extra_time_fare?: {
        rate: number;
        applicable_time: number;
    };
}

export interface MMTChargeComponent {
    amount: number;
    is_included_in_base_fare: boolean;
    is_included_in_grand_total: boolean;
    is_applicable?: boolean;
    applicable_time_from?: number;
    applicable_time_till?: number;
}

export interface MMTWaitingChargeComponent {
    amount: number;
    free_waiting_time: number;
    applicable_time: number;
    is_applicable: boolean;
}
