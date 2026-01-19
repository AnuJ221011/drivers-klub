import { JwtPayload } from "@driversklub/common";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
