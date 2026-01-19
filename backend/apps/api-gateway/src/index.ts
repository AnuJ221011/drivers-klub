import app from "./app.js";
import { config } from "./config/env.js";

const { port } = config;

// Fix for MaxListenersExceededWarning
require('events').EventEmitter.defaultMaxListeners = 50;

app.listen(port, () => {
    console.log(`API Gateway running on port ${port}`);
});
