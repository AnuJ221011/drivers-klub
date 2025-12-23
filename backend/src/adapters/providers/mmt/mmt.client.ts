import { BaseHttpClient } from "../shared/http.client.js";
import { getMMTToken } from "./mmt.auth.js";

class MMTClient extends BaseHttpClient {
    async request(method: "GET" | "POST", url: string, data?: any) {
        const token = await getMMTToken();
        return super.request(method, url, data, token);
    }
}

const client = new MMTClient(process.env.MMT_BASE_URL || "https://api.mmt.mock");
export const mmtRequest = client.request.bind(client);

