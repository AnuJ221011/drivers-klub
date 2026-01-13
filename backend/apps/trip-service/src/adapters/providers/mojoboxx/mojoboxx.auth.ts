import axios from "axios";

let cachedToken: string | null = null;
let expiry = 0;

export async function getMojoBoxxToken(): Promise<string> {
    if (cachedToken && Date.now() < expiry) {
        return cachedToken;
    }

    const res = await axios.post(
        `${process.env.MOJOBOXX_BASE_URL}/auth/v1/login`,
        {
            username: process.env.MOJOBOXX_USERNAME,
            password: process.env.MOJOBOXX_PASSWORD,
        }
    );

    cachedToken = res.data.token;
    expiry = res.data.expiresAt;

    return cachedToken!;
}
