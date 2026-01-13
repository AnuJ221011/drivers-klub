import { BaseHttpClient } from "../shared/http.client.js";
import { getMojoBoxxToken } from "./mojoboxx.auth.js";

class MojoBoxxClient extends BaseHttpClient {
    async request(method: "GET" | "POST", url: string, data?: any) {
        const token = await getMojoBoxxToken();
        return super.request(method, url, data, token);
    }
}

const client = new MojoBoxxClient(process.env.MOJOBOXX_BASE_URL || "");
export const mojoRequest = client.request.bind(client);

