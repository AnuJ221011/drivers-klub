-- Drop legacy FleetManager table (fleet managers are stored in User now)

DROP TABLE IF EXISTS "FleetManager";

-- Drop legacy enum (was only used by FleetManager.status)
DROP TYPE IF EXISTS "FleetManagerStatus";

