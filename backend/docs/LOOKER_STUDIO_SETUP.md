# Looker Studio Setup Guide

> **Target**: Connect Looker Studio to the live BigQuery Data Warehouse.  
> **Source**: Google BigQuery (`fact_rides` & `dim_drivers`).  
> **Status**: Ready for Production.

---

## 1. Prerequisites

* **Google Account**: You must have access to the GCP Project `drivers-klub`.
* **Permissions**: Ensure your email has `BigQuery Data Viewer` permissions (or ask the admin/service account owner).

## 2. Connect to BigQuery

1. Open [Looker Studio](https://lookerstudio.google.com/).
2. Click **Create** -> **Data Source**.
3. Search for **BigQuery** and select it.
4. Select:
    * **Project**: `drivers-klub` (or your specific GCP project ID)
    * **Dataset**: `analytics`
    * **Table**: `fact_rides`
5. Click **Connect**.

> **Tip**: Repeat this process to create a second data source for `dim_drivers`.

---

## 3. Data Schema (Available Fields)

Your data source now contains **Rich Analytics Data** (~40 Columns).

### 🚗 Fact: Rides (`fact_rides`)

* **Trip Info**: `trip_id`, `trip_type` (Intercity/Local), `status` (Completed/Cancelled).
* **Geospatial**: `pickup_lat`, `pickup_lng`, `drop_lat`, `drop_lng` (Create Maps!).
* **Location**: `origin_city`, `destination_city`, `distance_km`.
* **Financials**: `total_fare`, `rate_per_km`, `billable_km`.
* **Provider**: `provider_name` (Uber/Ola/Internal), `provider_status`.
* **Time**: `created_at`, `scheduled_pickup_time`, `started_at`, `completed_at`.

### 👤 Dimension: Drivers (`dim_drivers`)

* **Identity**: `driver_id`, `user_id`, `full_name`, `mobile`.
* **Fleet**: `fleet_id`, `current_vehicle_id`.
* **Status**: `current_status`, `is_available`, `kyc_status`.
* **Finance**: `payment_model`, `deposit_balance`, `rev_share_percentage`.

---

## 4. Suggested Reports

Here are some dashboards you can build immediately:

1. **Revenue Dashboard**:
    * Scorecard: `Sum(total_fare)`
    * Time Series: `total_fare` by `completed_at` (Day/Month).
    * Pie Chart: Revenue by `trip_type` (Intercity vs Local).

2. **Driver Performance**:
    * Table: `driver_name`, `Count(trip_id)`, `Sum(distance_km)`.
    * Filter: `status = 'COMPLETED'`.

3. **Geographic Heatmap**:
    * Google Maps Chart: Use `pickup_lat` and `pickup_lng`.
    * Bubble Size: `total_fare`.

---

## 5. Troubleshooting

* **No Data?**: The worker runs every 6 hours. Check `last_sync_time`.
* **Missing Columns?**: In Looker Studio, click "Edit Data Source" -> "Refresh Fields" to pull the latest schema additions.
* **Slow Queries?**: Add a "Date Range Control" to every page. BigQuery is partitioned by date, so this makes queries almost instant.
