# MMT Partner Integration - Complete Guide

**Version**: 1.3  
**Last Updated**: January 14, 2026  
**Environment**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Testing Guide](#testing-guide)
5. [Quick Reference](#quick-reference)
6. [Troubleshooting](#troubleshooting)
7. [Support](#support)

---

## Overview

This document provides complete integration details for the MakeMyTrip (MMT) Cab Booking partnership. It covers all API endpoints, authentication, testing procedures, and operational guidelines.

### Base URL

```text
https://[YOUR_DOMAIN]/partners/mmt
```

**Note**: Both formats are supported for backward compatibility:

- `/partners/mmt/...` (recommended)
- `/partner/mmt/...` (also works)

**Example**:

```text
https://api.example.com/partners/mmt/partnersearchendpoint
https://api.example.com/partner/mmt/partnersearchendpoint  (also works)
```

### Important Constraints (V1)

> [!IMPORTANT]
> **Please note these limitations for initial UAT:**

- **Vehicle Type**: Only `TATA_TIGOR_EV` is supported
- **Trip Type**: Only `AIRPORT` transfers are accepted
- **Advance Booking**: Pickup time must be **>24 hours** from now
- **City**: Defaults to `DELHI` if `pickupCity` is missing

---

## Authentication

### Method: HTTP Basic Authentication

All inbound APIs require Basic Authentication.

**Credentials** (will be provided separately):

- **Username**: `[PROVIDED_BY_DRIVERSKLUB]`
- **Password**: `[PROVIDED_BY_DRIVERSKLUB]`

### Authorization Header Format

```http
Authorization: Basic <base64_encoded_credentials>
```

**Example**:

```http
Authorization: Basic bW10X3VzZXI6bW10X3Bhc3N3b3Jk
```

### How to Generate Base64 Credentials

```bash
# Using command line
echo -n "username:password" | base64

# Using Node.js
node -e "console.log(Buffer.from('username:password').toString('base64'))"

# Using Python
python -c "import base64; print(base64.b64encode(b'username:password').decode())"
```

---

## API Endpoints

### 1. Search Fare (Availability Check)

**POST** `/partnersearchendpoint`

Checks availability and returns pricing for the requested route.

**Request Body (MMT Format)**:

We accept MMT's standard format with automatic field mapping:

```json
{
  "source": {
    "address": "Terminal 1, Indira Gandhi International Airport (DEL), New Delhi",
    "latitude": 28.5550838,
    "longitude": 77.0844015,
    "city": "Delhi"
  },
  "destination": {
    "address": "Noida, Uttar Pradesh, India",
    "latitude": 28.5355161,
    "longitude": 77.3910265,
    "city": "Noida"
  },
  "trip_type": "ONE_WAY",
  "start_time": "2026-01-16 13:00:00",
  "one_way_distance": 39,
  "partner_name": "GOMMT",
  "trip_type_details": {
    "basic_trip_type": "AIRPORT",
    "airport_type": "PICKUP"
  }
}
```

**Response (Verified V3 Format):**

```json
{
    "response": {
        "distance_booked": 45,
        "is_instant_search": false,
        "is_instant_available": true,
        "start_time": "2026-01-20T10:00:00.000Z",
        "is_part_payment_allowed": true,
        "communication_type": "PRE",
        "verification_type": "OTP",
        "airport_tags": ["AP"],
        "car_types": [
            {
                "sku_id": "TATA_TIGOR_EV",
                "type": "sedan",
                "subcategory": "basic",
                "combustion_type": "Electric",
                "model": "Tata Tigor",
                "carrier": false,
                "make_year_type": "Newer",
                "make_year": 2024,
                "cancellation_rule": "SUPER_FLEXI",
                "zero_payment": true,
                "min_payment_percentage": 100,
                "pax_capacity": 4,
                "luggage_capacity": 2,
                "amenities": {
                    "features": {
                        "vehicle": ["AC", "Music System", "Charging Point"],
                        "driver": ["Vaccinated", "Mask"],
                        "services": []
                    }
                },
                "fare_details": {
                    "base_fare": 1125,
                    "per_km_charge": 25,
                    "per_km_extra_charge": 20,
                    "total_driver_charges": 0,
                    "seller_discount": 0,
                    "extra_charges": {
                        "night_charges": { "amount": 0, "is_included_in_base_fare": false, "is_included_in_grand_total": false, "is_applicable": false },
                        "toll_charges": { "amount": 0, "is_included_in_base_fare": false, "is_included_in_grand_total": false, "is_applicable": true },
                        "state_tax": { "amount": 0, "is_included_in_base_fare": false, "is_included_in_grand_total": false, "is_applicable": true },
                        "parking_charges": { "amount": 0, "is_included_in_base_fare": false, "is_included_in_grand_total": false, "is_applicable": true },
                        "waiting_charges": { "amount": 100, "free_waiting_time": 45, "applicable_time": 30, "is_applicable": true },
                        "airport_entry_fee": { "amount": 0, "is_included_in_base_fare": false, "is_included_in_grand_total": false, "is_applicable": true }
                    }
                }
            }
        ]
    }
}
```

**Notes:**

- `per_km_charge` is dynamically calculated based on total fare / distance.
- `sku_id` is always `TATA_TIGOR_EV` for V1.
- `verification_type` defaults to `OTP`.

---

### 2. Block Ride (Pre-book)

**POST** `/partnerblockendpoint`

Temporarily holds the inventory.

**Request Body (MMT Format)**:

We accept MMT's standard format with automatic field mapping:

```json
{
  "sku_id": "TATA_TIGOR_EV",
  "mmt_ref_id": "MMT-1234567890",
  "order_reference_number": "MMT-1234567890",
  "start_time": "2026-01-16 13:00:00",
  "source": {
    "city": "Delhi",
    "address": "IGI Airport Terminal 1"
  },
  "destination": {
    "city": "Noida",
    "address": "Sector 62"
  },
  "one_way_distance": 39,
  "customer_name": "John Doe",
  "customer_mobile": "9876543210"
}
```

**Field Mapping**:

| MMT Field | → | Internal Field |
|-----------|---|----------------|
| `sku_id` | → | `skuId` |
| `mmt_ref_id` or `order_reference_number` | → | `mmtRefId` |
| `start_time` | → | `pickupTime` |
| `one_way_distance` | → | `distanceKm` |
| `source.city` | → | `pickupCity` |
| `destination.city` | → | `dropCity` |

**Response**:

```json
```json
{
    "response": {
        "success": true,
        "order_reference_number": "DK-XXXXXXXX",
        "status": "BLOCKED",
        "verification_code": "4829"
    }
}
```

> [!NOTE]
> Price is dynamically calculated. `verification_code` is a dynamically generated 4-digit OTP. Save the `order_reference_number` (Booking ID) for subsequent steps.

---

### 3. Confirm Paid (Confirm Booking)

**POST** `/partnerpaidendpoint`

Confirms the booking after MMT collects payment from the user.

**Request Body**:

```json
```json
{
  "order_reference_number": "DK-XXXXXXXX",
  "partner_reference_number": "MMT-1234567890",
  "amount_to_be_collected": 1250
}
```

**Response**:

```json
```json
{
    "response": {
        "success": true,
        "order_reference_number": "DK-XXXXXXXX",
        "status": "CONFIRMED"
    }
}
```

---

### 4. Cancel Ride

**POST** `/partnercancelendpoint`

Cancels a confirmed booking.

**Request Body**:

```json
```json
{
  "order_reference_number": "DK-XXXXXXXX",
  "cancelled_by": "Customer",
  "cancellation_reason": "Change of plans"
}
```

**Response**:

```json
```json
{
    "response": {
        "success": true
    }
}
```

---

### 5. Reschedule - Check (Block)

**POST** `/partnerrescheduleblockendpoint`

Validates if a reschedule is possible for the new time.

**Request Body**:

```json
{
  "order_reference_number": "DK-XXXXXXXX",
  "start_time": "2026-01-16T14:00:00Z"
}
```

**Response**:

```json
{
  "response": {
    "success": true,
    "verification_code": "1234",
    "fare_details": {
      "total_amount": 1250,
      "payable_amount": 1250
    },
    "driver_details": { }
  }
}
```

---

### 6. Reschedule - Confirm

**POST** `/partnerrescheduleconfirmendpoint`

Commits the reschedule. **Note**: Does not require time in body; uses the time validated in the Block step.

**Request Body**:

```json
{
  "order_reference_number": "DK-XXXXXXXX"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Reschedule confirmed"
}
```

---

### 7. Get Booking Details

**GET** `/booking/details`

Retrieves the current status of a booking. Requires Basic Authentication.

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `booking_id`               | string | DriversKlub internal booking ID (e.g., `DK-XXXXXXXX`) |
| `partner_reference_number` | string | MMT external reference ID (e.g., `MMT-1234567890`) |

> [!IMPORTANT]
> Use `booking_id` when you have our internal ID, or `partner_reference_number` when searching by MMT's reference. Only one parameter is required.

**Examples**:

```bash
# Search by DriversKlub booking ID
GET /booking/details?booking_id=DK-XXXXXXXX

# Search by MMT reference ID  
GET /booking/details?partner_reference_number=MMT-1234567890
```

**Response**:

```json
{
  "bookingId": "DK-XXXXXXXX",
  "status": "CONFIRMED",
  "mmtRefId": "MMT-1234567890",
  "driver": {
    "name": "Driver Name",
    "phone": "9876543210",
    "vehicle": "DL01AB1234"
  }
}
```

> [!NOTE]
> The `driver` field is `null` if no driver has been assigned yet.

---

## Testing Guide

### Recommended Testing Route

**Route**: Delhi (IGI Airport) → Noida Sector 62

**Details**:

- Distance: 45 km
- Trip Type: AIRPORT
- Vehicle: TATA_TIGOR_EV
- Pickup Time: Any time >24 hours from now

**Why this route?**

- ✅ Meets 24-hour advance booking requirement
- ✅ Supported vehicle type
- ✅ AIRPORT trip type (required for V1)
- ✅ Realistic distance for pricing validation

---

### Complete Testing Flow

#### Step 1: Search Fare

**cURL Example**:

```bash
curl -X POST https://[YOUR_DOMAIN]/partners/mmt/partnersearchendpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic [YOUR_BASE64_CREDENTIALS]" \
  -d '{
    "source": {"city": "Delhi"},
    "destination": {"city": "Noida"},
    "start_time": "2026-01-16 13:00:00",
    "trip_type_details": {"basic_trip_type": "AIRPORT"},
    "one_way_distance": 45
  }'
```

**Expected**: 200 OK with availability response

---

#### Step 2: Block Ride

**cURL Example**:

```bash
curl -X POST https://[YOUR_DOMAIN]/partners/mmt/partnerblockendpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic [YOUR_BASE64_CREDENTIALS]" \
  -d '{
    "sku_id": "TATA_TIGOR_EV",
    "mmt_ref_id": "MMT-TEST-001",
    "start_time": "2026-01-20T10:00:00.000Z",
    "source": { "city": "DELHI", "latitude": 28.61, "longitude": 77.20 },
    "destination": { "city": "GURGAON", "latitude": 28.45, "longitude": 77.02 },
    "customer_name": "Test User",
    "customer_mobile": "9876543210",
    "one_way_distance": 45
  }'
```

**Expected**: 200 OK with `bookingId` in response

**⚠️ Save the `bookingId` for next steps!**

---

#### Step 3: Confirm Paid

**cURL Example** (replace `DK-XXXXXXXX` with actual bookingId):

```bash
curl -X POST https://[YOUR_DOMAIN]/partners/mmt/partnerpaidendpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic [YOUR_BASE64_CREDENTIALS]" \
  -d '{
    "bookingId": "DK-XXXXXXXX",
    "amountPaid": 1250,
    "paymentRef": "PAY-TEST-001"
  }'
```

**Expected**: 200 OK with confirmation message

---

#### Step 4: Get Booking Details

**cURL Example**:

```bash
curl -X GET "https://[YOUR_DOMAIN]/partners/mmt/booking/details?booking_id=DK-XXXXXXXX" \
  -H "Authorization: Basic [YOUR_BASE64_CREDENTIALS]"
```

**Expected**: 200 OK with booking status

---

### Alternative Test Routes

#### Route 2: Delhi → Gurgaon (Cyber City)

```json
{
  "pickupCity": "Delhi",
  "dropCity": "Gurgaon",
  "pickupTime": "2026-01-15T14:00:00Z",
  "tripType": "AIRPORT",
  "distanceKm": 35
}
```

#### Route 3: Delhi (IGI) → Faridabad

```json
{
  "pickupCity": "Delhi",
  "dropCity": "Faridabad",
  "pickupTime": "2026-01-15T16:00:00Z",
  "tripType": "AIRPORT",
  "distanceKm": 40
}
```

---

### Testing Checklist

- [ ] **Authentication Test**: Verify Basic Auth works
- [ ] **Search Fare**: Test availability check
- [ ] **Block Ride**: Test booking creation
- [ ] **Confirm Paid**: Test booking confirmation
- [ ] **Get Details**: Test status retrieval
- [ ] **Cancel**: Test cancellation flow
- [ ] **Reschedule Block**: Test reschedule validation
- [ ] **Reschedule Confirm**: Test reschedule confirmation
- [ ] **Error: Invalid Credentials**: Test 401 response
- [ ] **Error: Invalid Vehicle**: Test 400 response
- [ ] **Error: Booking < 24h**: Test advance booking validation

---

## Webhook Endpoints (Outbound from DriversKlub)

After booking confirmation, you will receive trip status updates at your webhook endpoints via HTTP POST requests.

### Configuration

We require: - **Webhook Base URL**: Your endpoint base URL (e.g., `https://api.mmt.com/webhooks/driversklub`)

- **Authorization**: We will include a Bearer token in the Authorization header

### Webhook Endpoints

| Endpoint | Purpose | When Triggered |
|----------|---------|----------------|
| `/driver-assigned` | Driver details | When driver is assigned |
| `/arrived` | Driver arrival | Driver reaches pickup |
| `/start` | Trip started | Driver starts trip |
| `/pickup` | Passenger onboard | OTP verified |
| `/update-location` | Live GPS | Every 30 seconds |
| `/alight` | Trip completed | Trip ends |
| `/not_boarded` | No-show | Customer doesn't show |
| `/reassign-chauffeur` | Driver change | Driver reassigned |
| `/detach-trip` | Cancellation | Trip cancelled |

### Webhook Payload Examples

#### Driver Assigned

```json
{
  "order_reference_number": "DK-XXXXXXXX",
  "driver_details": {
    "name": "Driver Name",
    "phone": "9876543210",
    "vehicle_number": "DL01AB1234"
  },
  "timestamp": "2026-01-15T10:00:00.000Z"
}
```

#### Trip Completed

```json
{
  "order_reference_number": "DK-XXXXXXXX",
  "timestamp": "2026-01-15T11:30:00.000Z",
  "final_details": {
    "distance_km": 45,
    "fare_amount": 1250,
    "currency": "INR"
  }
}
```

#### Location Update

```json
{
  "order_reference_number": "DK-XXXXXXXX",
  "timestamp": "2026-01-15T10:15:00.000Z",
  "location": {
    "lat": 28.5355,
    "lng": 77.3910
  }
}
```

---

## Quick Reference

### Endpoints Summary

| Action | Endpoint |
|--------|----------|
| Search Fare | `POST /partnersearchendpoint` |
| Block Ride | `POST /partnerblockendpoint` |
| Confirm Paid | `POST /partnerpaidendpoint` |
| Cancel | `POST /partnercancelendpoint` |
| Reschedule Block | `POST /partnerrescheduleblockendpoint` |
| Reschedule Confirm | `POST /partnerrescheduleconfirmendpoint` |
| Booking Details | `GET /partners/mmt/booking/details` |

### Quick Test (Happy Path)

```bash
# 1. Search
POST /partnersearchendpoint
{"start_time":"2026-01-20T10:00:00.000Z","trip_type_details":{"basic_trip_type":"AIRPORT","airport_type":"PICKUP"},"one_way_distance":45,"source":{"city":"DELHI"},"destination":{"city":"GURGAON"},"search_id":"test-1","partner_name":"MMT"}

# 2. Block (save order_reference_number)
POST /partnerblockendpoint
{"sku_id":"TATA_TIGOR_EV","mmt_ref_id":"MMT-TEST-1","start_time":"2026-01-20T10:00:00.000Z","source":{"city":"DELHI"},"vehicle_details":{"sku_id":"TATA_TIGOR_EV"},"trip_type_details":{"basic_trip_type":"AIRPORT"},"one_way_distance":45}

# 3. Confirm
POST /partnerpaidendpoint
{"order_reference_number":"DK-XXXXXXXX","partner_reference_number":"MMT-TEST-1","amount_to_be_collected":1250}

# 4. Cancel
POST /partnercancelendpoint
{"order_reference_number":"DK-XXXXXXXX","cancelled_by":"Customer","cancellation_reason":"Test"}

# 5. Check Status
GET /partners/mmt/booking/details?booking_id=DK-XXXXXXXX
```

### V1 Constraints

- ✅ Vehicle: `TATA_TIGOR_EV` only
- ✅ Trip Type: `AIRPORT` only
- ✅ Booking: >24 hours advance
- ✅ City: Defaults to `DELHI`

---

## Troubleshooting

### Error: 401 Unauthorized

**Cause**: Invalid credentials or missing Authorization header

**Solution**:

- Verify Authorization header format: `Authorization: Basic <base64>`
- Check credentials are correctly base64 encoded
- Ensure no extra spaces in the header

---

### Error: 400 Bad Request - "Advance booking required"

**Cause**: Pickup time is less than 24 hours from now

**Solution**:

- Use a pickup time at least 24 hours in the future
- Example: If today is Jan 13, use Jan 15 or later

---

### Error: 400 Bad Request - "Invalid vehicle type"

**Cause**: Using a vehicle type other than `TATA_TIGOR_EV`

**Solution**:

- Only use `"skuId": "TATA_TIGOR_EV"` in V1

---

### Error: 400 Bad Request - "Invalid trip type"

**Cause**: Using a trip type other than `AIRPORT`

**Solution**:

- Only use `"tripType": "AIRPORT"` in V1

---

### Error: 500 Internal Server Error

**Cause**: Server-side issue

**Solution**:

- Contact DriversKlub support team
- Provide request payload and timestamp
- Check if issue persists

---

## Postman Collection Setup

### Collection Configuration

1. **Create Collection**: "MMT Integration"
2. **Set Authorization** (Collection level):
   - Type: Basic Auth
   - Username: `[PROVIDED_BY_DRIVERSKLUB]`
   - Password: `[PROVIDED_BY_DRIVERSKLUB]`
3. **Set Variable**:
   - `base_url`: `https://[YOUR_DOMAIN]/partners/mmt`

### Sample Requests

All requests inherit authentication from collection settings.

**Search Fare**:

```http
POST {{base_url}}/partnersearchendpoint
Content-Type: application/json

{
  "start_time": "2026-01-20T10:00:00.000Z",
  "source": { "city": "DELHI" },
  "destination": { "city": "GURGAON" },
  "trip_type_details": {
    "basic_trip_type": "AIRPORT",
    "airport_type": "PICKUP"
  },
  "one_way_distance": 45
}
```

**Block Ride**:

```http
POST {{base_url}}/partnerblockendpoint
Content-Type: application/json

{
  "sku_id": "TATA_TIGOR_EV",
  "mmt_ref_id": "MMT-TEST-{{$timestamp}}",
  "start_time": "2026-01-20T10:00:00.000Z",
  "source": { "city": "DELHI" },
  "trip_type_details": {
    "basic_trip_type": "AIRPORT"
  },
  "one_way_distance": 45
}
```

---

## Support & Contact

**Technical Support**: [support-email]  
**Integration Team**: [integration-email]  
**Documentation**: This guide

**Response Time**:

- Critical issues: 2 hours
- General queries: 24 hours

---

## Important Notes

- All timestamps must be in **ISO 8601 format (UTC)**
- All amounts are in **INR (Indian Rupees)**
- Phone numbers should be **10 digits (Indian format)**
- Booking IDs are prefixed with **`DK-`**
- MMT reference IDs should be **unique per booking**

---

## Next Steps

1. ✅ Review this documentation
2. ✅ Set up authentication credentials
3. ✅ Test Search Fare endpoint
4. ✅ Complete full booking flow (Search → Block → Confirm)
5. ✅ Provide webhook URLs
6. ✅ Schedule integration call
7. ✅ Complete UAT testing
8. ✅ Production deployment

---

**Document Version**: 1.3  
**Last Updated**: January 14, 2026  
**Status**: Production Ready 🚀

---

**Happy Testing! 🚀**
