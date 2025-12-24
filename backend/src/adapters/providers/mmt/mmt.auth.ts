
import axios from "axios";

// Simple in-memory cache (Production should use Redis)
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

const MMT_CONFIG = {
    authUrl: process.env.MMT_AUTH_URL || "https://api-cert.makemytrip.com/v1/auth",
    clientId: process.env.MMT_CLIENT_ID || "mock-client",
    clientSecret: process.env.MMT_CLIENT_SECRET || "mock-secret"
};

export class MMTAuthManager {
    static async getToken(): Promise<string> {
        // 1. Return cached if valid (with 5 min buffer)
        if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 5 * 60 * 1000) {
            return cachedToken;
        }

        // 2. Refresh
        return this.refreshTokenWithRetry();
    }

    private static async refreshTokenWithRetry(retries = 3): Promise<string> {
        try {
            console.log("[MMT_AUTH] Refreshing Token...");

            // Mock call for now if no real env vars, else real axios call
            let newToken: string;
            let expiresIn: number;

            if (MMT_CONFIG.clientId === "mock-client") {
                // Simulation
                newToken = "mmt-mock-token-" + Date.now();
                expiresIn = 3600; // 1 hour
            } else {
                const response = await axios.post(MMT_CONFIG.authUrl, {
                    client_id: MMT_CONFIG.clientId,
                    client_secret: MMT_CONFIG.clientSecret,
                    grant_type: "client_credentials"
                });
                newToken = response.data.access_token;
                expiresIn = response.data.expires_in;
            }

            // Update Cache
            cachedToken = newToken;
            tokenExpiry = Date.now() + (expiresIn * 1000);

            return newToken;

        } catch (error) {
            if (retries > 0) {
                console.warn(`[MMT_AUTH] Failed to refresh token. Retrying... (${retries} left)`);
                await new Promise(res => setTimeout(res, 1000));
                return this.refreshTokenWithRetry(retries - 1);
            }
            throw new Error("Failed to authenticate with MMT after retries");
        }
    }
}

export const getMMTToken = MMTAuthManager.getToken.bind(MMTAuthManager);
