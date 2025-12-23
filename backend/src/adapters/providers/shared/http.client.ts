import axios, { AxiosRequestConfig } from "axios";
import { v4 as uuid } from "uuid";

export class BaseHttpClient {
    constructor(private baseURL: string) { }

    protected async request(
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
        url: string,
        data?: any,
        token?: string,
        headers: Record<string, string> = {}
    ) {
        const config: AxiosRequestConfig = {
            method,
            url: `${this.baseURL}${url}`,
            data,
            headers: {
                "Content-Type": "application/json",
                "X-Correlation-ID": uuid(),
                ...headers,
            },
        };

        if (token) {
            config.headers!["Authorization"] = `Bearer ${token}`;
        }

        return axios(config);
    }
}
