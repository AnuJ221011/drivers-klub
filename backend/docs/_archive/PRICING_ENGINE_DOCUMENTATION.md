# Pricing Engine Documentation

## Overview

The Pricing Engine is responsible for calculating fare estimates for trips based on distance, time, vehicle type, and demand multipliers.

## Components

- **PricingController:** Handles the HTTP request, input validation, and invokes the pricing logic.
- **PricingEngine:** Contains the core business logic for fare calculation.
- **GoogleMapsAdapter:** **(NEW)** Provides logic to interface with Google Maps APIs (Routes, Geocoding, Autocomplete).

## Distance Calculation Strategy

The system uses a **Hybrid Distance Calculation** strategy to ensure accuracy and cost-efficiency:

1. **Primary: Google Maps Routes API (Compute Routes)**
    - If `pickup` and `drop` locations are provided, and a valid `GOOGLE_MAPS_API_KEY` is configured.
    - Uses the modern **Routes API** for traffic-aware, highly accurate distance and duration.
    - **Caching:** Results are cached for **24 hours** to minimize API costs (Routes + Geocoding).
    - **Geocoding:** Addresses are first geocoded to Lat/Lng for precise routing.

2. **Fallback: Client-Provided Distance**
    - If Google Maps fails (quota, network, invalid key) or is not configured.
    - Uses `distanceKm` sent by the client app.
    - **Transparency:** The response includes `distanceSource` ("GOOGLE_MAPS" or "CLIENT_PROVIDED").

### Google Maps Suite

The system now exposes a full suite of Maps capabilities via backend proxies:

- **Routes API:** For pricing (internal use via `PricingController`).
- **Autocomplete API:** `GET /maps/autocomplete` (for location search).
- **Geocoding API:** `GET /maps/geocode` (for address resolution).

## Configuration

Environment variables required:

```bash
# Optional: Google Maps API Key
GOOGLE_MAPS_API_KEY="your_api_key"
```

## Pricing Logic

The pricing formula is:

```
Total Fare = (Base Fare + (Distance - Base Distance) * Rate/Km) * Multipliers
```

### Multipliers

- **Vehicle Multiplier:** EV (1.0x), Non-EV (1.1x), Luxury (1.5x)
- **Trip Type Multiplier:** Local (1.0x), Outstation (1.2x), Airport (1.2x)
- **Booking Time Multiplier:**
  - Advance Booking (>24h): 0.9x (10% Discount)
  - Standard Booking: 1.0x

## Response Format

```json
{
  "success": true,
  "data": {
    "distanceSource": "GOOGLE_MAPS", // or "CLIENT_PROVIDED"
    "billableDistanceKm": 26,
    "ratePerKm": 25,
    "baseFare": 650,
    "totalFare": 780,
    "breakdown": {
      "distanceFare": 650,
      "tripTypeMultiplier": 1.2,
      "bookingTimeMultiplier": 1.0,
      "vehicleMultiplier": 1.0
    },
    "currency": "INR"
  },
  "message": "Fare calculated successfully"
}
```

## Vehicle SKU Support

The engine supports `vehicleSku` for backward compatibility with older clients or specific vehicle definitions.

- `vehicleSku` containing "EV" -> treated as `vehicleType: "EV"`
- `vehicleSku` without "EV" -> treated as `vehicleType: "NON_EV"`
