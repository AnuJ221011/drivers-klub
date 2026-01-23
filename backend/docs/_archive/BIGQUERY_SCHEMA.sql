-- ============================================================
-- BigQuery Production Schema for Drivers Klub
-- Dataset: drivers-klub
-- ============================================================

-- 1. FACT TABLE: RIDES
-- Represents individual trips. High volume, immutable after completion.
CREATE SCHEMA IF NOT EXISTS `drivers-klub.analytics`;

CREATE TABLE IF NOT EXISTS `drivers-klub.analytics.fact_rides` (
    trip_id STRING NOT NULL,
    trip_type STRING,               -- AIRPORT, RENTAL, INTER_CITY
    status STRING,                  -- COMPLETED, CANCELLED, STARTED, etc.
    
    -- Participants
    driver_id STRING,
    customer_id STRING,             -- Mapped from User ID if internal, or external ref
    vehicle_sku STRING,
    
    -- Locations
    origin_city STRING,
    destination_city STRING,
    pickup_lat FLOAT64,
    pickup_lng FLOAT64,
    drop_lat FLOAT64,
    drop_lng FLOAT64,
    
    -- Metrics
    distance_km FLOAT64,
    billable_km INT64,
    rate_per_km INT64,
    total_fare FLOAT64,
    
    -- Timestamps
    created_at TIMESTAMP,
    scheduled_pickup_time TIMESTAMP, -- stored as tripDate/pickupTime in DB
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Partner/Provider Info
    provider_name STRING,           -- MMT, RAPIDO, MOJOBOXX, INTERNAL
    provider_booking_id STRING,
    provider_status STRING,
    
    -- Record Metadata
    etl_inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY status, provider_name;

-- 2. DIMENSION TABLE: FLEETS
-- Represents Fleet Owners / Agencies
CREATE TABLE IF NOT EXISTS `drivers-klub.analytics.dim_fleets` (
    fleet_id STRING NOT NULL,
    fleet_name STRING,
    city STRING,
    fleet_type STRING,              -- INDIVIDUAL, COMPANY
    status STRING,                  -- ACTIVE, INACTIVE
    
    contact_mobile STRING,
    gst_number STRING,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    etl_inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 3. DIMENSION TABLE: DRIVERS
-- Captures the state of drivers. Slowly Changing Dimension (SCD) Type 1 (Latest state) primarily.
CREATE TABLE IF NOT EXISTS `drivers-klub.analytics.dim_drivers` (
    driver_id STRING NOT NULL,
    user_id STRING,
    fleet_id STRING,                -- Link to Fleet
    
    -- Personal Info
    full_name STRING,
    mobile STRING,
    city STRING,
    
    -- Operational Status
    current_status STRING,          -- ACTIVE, INACTIVE, SUSPENDED
    kyc_status STRING,
    is_available BOOL,
    
    -- Assets
    current_vehicle_id STRING,
    
    -- Financials
    payment_model STRING,           -- RENTAL, PAYOUT
    deposit_balance FLOAT64,
    rev_share_percentage FLOAT64,
    
    -- Timestamps
    joined_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    etl_inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 4. DIMENSION TABLE: VEHICLES
CREATE TABLE IF NOT EXISTS `drivers-klub.analytics.dim_vehicles` (
    vehicle_id STRING NOT NULL,
    vehicle_number STRING,
    vehicle_model STRING,
    fuel_type STRING,               -- EV, DIESEL, etc.
    ownership_type STRING,          -- OWNED, LEASED
    
    fleet_id STRING,
    hub_id STRING,
    
    status STRING,
    entry_date TIMESTAMP,
    
    etl_inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 4. FACT TABLE: TRANSACTIONS
-- Financial movements (Payments, Penalties, Incentives)
CREATE TABLE IF NOT EXISTS `drivers-klub.analytics.fact_transactions` (
    transaction_id STRING NOT NULL,
    
    -- Related Entities
    driver_id STRING,
    booking_id STRING,              -- Optional link to a specific ride
    
    -- Financials
    amount FLOAT64,
    transaction_type STRING,        -- DEPOSIT, RENTAL, TRIP_PAYMENT, INCENTIVE
    transaction_status STRING,      -- SUCCESS, PENDING, FAILED
    payment_method STRING,          -- CASH, UPI, PG
    
    -- Details
    description STRING,
    easebuzz_txn_id STRING,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    etl_inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY transaction_type, transaction_status;

-- 5. DAILY AGGREGATE: COLLECTIONS (Optional but recommended for speed)
CREATE TABLE IF NOT EXISTS `drivers-klub.analytics.agg_daily_collections` (
    collection_date DATE,
    driver_id STRING,
    vehicle_id STRING,
    
    total_collected FLOAT64,
    qr_amount FLOAT64,
    cash_amount FLOAT64,
    
    expected_revenue FLOAT64,
    variance FLOAT64,
    
    is_reconciled BOOL,
    
    etl_inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY collection_date;

-- 6. DIMENSION TABLE: USERS (Internal / Staff / Fleet Managers)
CREATE TABLE IF NOT EXISTS `drivers-klub.analytics.dim_users` (
    user_id STRING NOT NULL,
    full_name STRING,
    phone STRING,
    role STRING,                    -- SUPER_ADMIN, FLEET_ADMIN, OPERATIONS
    fleet_id STRING,                -- If Fleet Admin
    
    is_active BOOL,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    etl_inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);
