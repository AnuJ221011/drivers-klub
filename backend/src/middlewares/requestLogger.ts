import morgan from "morgan";
import { logger } from "../utils/logger.js";

export const requestLogger = morgan(
    ":method :url :status :response-time ms",
    {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }
);
