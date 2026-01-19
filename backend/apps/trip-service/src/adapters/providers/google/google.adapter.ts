
import axios from "axios";
import axiosRetry from "axios-retry";
import NodeCache from "node-cache";
import { logger } from "@driversklub/common";

export class GoogleMapsAdapter {
    private apiKey: string;
    private cache: NodeCache;

    // API Endpoints
    private routesUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";
    private geocodingUrl = "https://maps.googleapis.com/maps/api/geocode/json";
    private autocompleteUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json";

    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
        if (!this.apiKey) {
            logger.warn("GOOGLE_MAPS_API_KEY is not set. Google Maps integration will typically fail.");
        }

        // Initialize Cache: TTL 24 hours for Routes/Geocoding, 1 hour for Autocomplete
        this.cache = new NodeCache({ stdTTL: 86400 });

        // Configure Retries: 3 retries, exponential backoff
        axiosRetry(axios, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => {
                return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
            }
        });
    }

    /**
     * Get distance and duration between two points using Routes API (computeRoutes).
     * Replaces deprecated Distance Matrix API.
     */
    async getDistance(origin: string, destination: string): Promise<{ distanceKm: number; durationMins: number } | null> {
        if (!this.apiKey) return null;

        const cacheKey = `route_${origin.toLowerCase().trim()}_${destination.toLowerCase().trim()}`;
        const cachedResult = this.cache.get<{ distanceKm: number; durationMins: number }>(cacheKey);

        if (cachedResult) {
            logger.info("Google Routes API: strict cache hit", { origin, destination });
            return cachedResult;
        }

        try {
            // Using Routes API (better accuracy, modern)
            // It expects a POST request with specific field mask
            const start = await this.getGeocode(origin);
            const end = await this.getGeocode(destination);

            if (!start || !end) {
                logger.warn("Could not geocode origin or destination for route", { origin, destination });
                return null;
            }

            const response = await axios.post(
                this.routesUrl,
                {
                    origin: { location: { latLng: { latitude: start.lat, longitude: start.lng } } },
                    destination: { location: { latLng: { latitude: end.lat, longitude: end.lng } } },
                    travelMode: "DRIVE",
                    routingPreference: "TRAFFIC_AWARE",
                    computeAlternativeRoutes: false
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": this.apiKey,
                        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.staticDuration"
                    },
                    timeout: 8000 // 8s timeout for complex routes
                }
            );

            const route = response.data.routes?.[0];

            if (!route) {
                logger.warn("Google Routes API: No route found", { origin, destination });
                return null;
            }

            // Route response contains distanceMeters and duration (e.g., "1200s")
            const distanceMeters = route.distanceMeters || 0;
            const durationString = route.duration || "0s"; // Format "123s"
            const durationSeconds = parseInt(durationString.replace("s", ""), 10);

            const result = {
                distanceKm: distanceMeters / 1000,
                durationMins: Math.ceil(durationSeconds / 60)
            };

            // Store in cache
            this.cache.set(cacheKey, result);

            logger.info("Google Routes API: Success", {
                origin,
                destination,
                distanceKm: result.distanceKm
            });

            return result;

        } catch (error: any) {
            logger.error("Failed to fetch route from Google Routes API", {
                message: error.message,
                origin,
                destination,
                response: error.response?.data
            });
            return null;
        }
    }

    /**
     * Geocode an address to Lat/Lng.
     * Used internally for routing and externally for location pin.
     */
    async getGeocode(address: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
        if (!this.apiKey) return null;

        const cacheKey = `geo_${address.toLowerCase().trim()}`;
        const cachedResult = this.cache.get<{ lat: number; lng: number; formattedAddress: string }>(cacheKey);

        if (cachedResult) return cachedResult;

        try {
            const response = await axios.get(this.geocodingUrl, {
                params: {
                    address: address,
                    key: this.apiKey
                },
                timeout: 5000
            });

            const result = response.data.results?.[0];
            if (!result) return null;

            const data = {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                formattedAddress: result.formatted_address
            };

            this.cache.set(cacheKey, data);
            return data;

        } catch (error: any) {
            logger.error("Google Geocoding API Error", { message: error.message, address });
            return null;
        }
    }

    /**
     * Get Autocomplete suggestions for a query.
     * Caches short queries (short TTL) to prevent spam.
     */
    async getAutocomplete(query: string): Promise<any[]> {
        if (!this.apiKey || !query || query.length < 3) return [];

        const cacheKey = `auto_${query.toLowerCase().trim()}`;
        // Lower TTL for autocomplete (1 hour) as places change less often
        const cachedResult = this.cache.get<any[]>(cacheKey);

        if (cachedResult) return cachedResult;

        try {
            const response = await axios.get(this.autocompleteUrl, {
                params: {
                    input: query,
                    key: this.apiKey,
                    types: "geocode", // focus on addresses
                    components: "country:in" // Restrict to India (configurable)
                },
                timeout: 3000
            });

            if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
                logger.warn("Google Autocomplete Error", { status: response.data.status });
                return [];
            }

            const predictions = response.data.predictions || [];

            // Map to simpler format
            const results = predictions.map((p: any) => ({
                description: p.description,
                placeId: p.place_id,
                mainText: p.structured_formatting?.main_text || "",
                secondaryText: p.structured_formatting?.secondary_text || ""
            }));

            this.cache.set(cacheKey, results, 3600); // 1 hour TTL
            return results;

        } catch (error: any) {
            logger.error("Google Autocomplete API Error", { message: error.message });
            return [];
        }
    }
}
