import { Request, Response } from "express";
import { logger } from "@driversklub/common";
import { GoogleMapsAdapter } from "../../adapters/providers/google/google.adapter.js";

const googleMaps = new GoogleMapsAdapter();

export class MapsController {
    /**
     * Get autocomplete suggestions for a query
     * GET /maps/autocomplete?query=...
     */
    static async getAutocomplete(req: Request, res: Response) {
        try {
            const { query } = req.query;

            if (!query || typeof query !== "string" || query.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: "Query must be a string with at least 3 characters"
                });
            }

            const suggestions = await googleMaps.getAutocomplete(query);

            return res.status(200).json({
                success: true,
                data: suggestions
            });

        } catch (error: any) {
            logger.error("Error in MapsController.getAutocomplete", { error: error.message });
            return res.status(500).json({
                success: false,
                message: "Failed to fetch suggestions"
            });
        }
    }

    /**
     * Geocode an address to get usage details
     * GET /maps/geocode?address=...
     */
    static async getGeocode(req: Request, res: Response) {
        try {
            const { address } = req.query;

            if (!address || typeof address !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Address parameter is required"
                });
            }

            const result = await googleMaps.getGeocode(address);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Location not found"
                });
            }

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error: any) {
            logger.error("Error in MapsController.getGeocode", { error: error.message });
            return res.status(500).json({
                success: false,
                message: "Failed to geocode address"
            });
        }
    }
}
