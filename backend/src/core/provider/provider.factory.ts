import { Provider } from "@prisma/client";
import { MojoBoxxAdapter } from "../../adapters/providers/mojoboxx/mojoboxx.adapter.js";
import { MMTAdapter } from "../../adapters/providers/mmt/index.js";

export class ProviderFactory {
    static getProvider(provider: Provider) {
        switch (provider) {
            case Provider.MOJOBOXX:
                return new MojoBoxxAdapter();
            case Provider.MMT:
                return new MMTAdapter();
            default:
                throw new Error("Unsupported provider");
        }
    }
}
