const path = require("path");

const apps = [
    {
        name: "api-gateway",
        path: "apps/api-gateway",
        port: 8080,
        memory: "512M"
    },
    { name: "auth-service", path: "apps/auth-service" },
    { name: "driver-service", path: "apps/driver-service" },
    { name: "vehicle-service", path: "apps/vehicle-service" },
    { name: "assignment-service", path: "apps/assignment-service" },
    { name: "trip-service", path: "apps/trip-service" },
    { name: "notification-service", path: "apps/notification-service" }
];

module.exports = {
    apps: apps.map(app => ({
        name: app.name,
        cwd: path.join(__dirname, app.path),
        script: path.join(__dirname, app.path, "dist", "index.js"),
        env: {
            ...(app.port ? { PORT: process.env.PORT || app.port } : {})
        },
        memory_limit: app.memory || "256M"
    }))
};
