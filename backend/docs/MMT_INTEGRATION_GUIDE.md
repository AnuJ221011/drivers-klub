# MMT Partner Integration Guide

**Version**: 1.0 (V1 Implementation)
**Last Updated**: January 2026

## Overview

This document serves as the technical integration manual for the MakeMyTrip (MMT) Cab Booking partnership. It details the API endpoints exposed by **Drivers Klub** for MMT to consume (Inbound) and the webhooks Drivers Klub will call to update MMT (Outbound).

---

## 1. Integration Prerequisites

### Base URL

All Inbound APIs are hosted at:
`https://[YOUR_PRODUCTION_DOMAIN]`

*(Contact Ops for the Staging/UAT URL)*

### Authentication
>
> [!WARNING]
> **Current Status**: Open / No Auth
> The partner endpoints are currently open for V1 integration testing.
>
> - **Future State**: Will require `x-api-key` or `Authorization: Bearer <token>` header.

### Constraints & Hardcoded Values (V1)
>
> [!NOTE]
> The system is currently optimized for a specific SKU and region for initial UAT.

1. **Vehicle SKU**: Only `TATA_TIGOR_EV` is supported.
2. **City**: Defaults to `DELHI` if `pickupCity` is missing.
3. **Advance Booking**: Only bookings made > 24 hours in advance are accepted.
4. **Trip Type**: Only `AIRPORT` transfers are supported in the pricing engine.

---

## 2. Inbound APIs (MMT → Drivers Klub)

These endpoints allow MMT to search, book, and manage rides.

### 2.1 Search Fare (Availability)

**POST** `/partner/mmt/partnersearchendpoint`

Checks availability and returns pricing for the requested route.

**Request Body:**

```json
{
  "pickupCity": "Delhi",
  "dropCity": "Gurgaon",
  "pickupTime": "2026-01-20T10:00:00Z",
  "tripType": "AIRPORT",
  "distanceKm": 45
}
```

**Response:**

```json
{
  "available": true,
  "skus": [
    {
      "id": "TATA_TIGOR_EV",
      "name": "Tata Tigor EV",
      "price": 1250,
      "currency": "INR",
      "taxIncluded": true
    }
  ]
}
```

### 2.2 Block Ride (Pre-book)

**POST** `/partner/mmt/partnerblockendpoint`

Temporarily holds the inventory.

**Request Body:**

```json
{
  "skuId": "TATA_TIGOR_EV",
  "mmtRefId": "MMT-1234567890",
  "pickupTime": "2026-01-20T10:00:00Z",
  "pickupCity": "Delhi",
  "dropCity": "Gurgaon",
  "name": "John Doe",
  "mobile": "9876543210"
}
```

### 2.3 Confirm Paid (Confirm Booking)

**POST** `/partner/mmt/partnerpaidendpoint`

Confirms the booking after MMT collects payment from the user.

**Request Body:**

```json
{
  "bookingId": "DK-BOOKING-ID-FROM-BLOCK-RESPONSE",
  "amountPaid": 1250,
  "paymentRef": "PAY-12345"
}
```

### 2.4 Cancel Ride

**POST** `/partner/mmt/partnercancelendpoint`

Cancels a confirmed booking.

**Request Body:**

```json
{
  "bookingId": "DK-BOOKING-ID"
}
```

### 2.5 Reschedule - Check (Block)

**POST** `/partner/mmt/partnerrescheduleblockendpoint`

Validates if a reschedule is possible for the new time.

**Request Body:**

```json
{
  "order_reference_number": "DK-BOOKING-ID-OR-MMT-ID",
  "start_time": "2026-01-21T14:00:00Z"
}
```

**Response:**

```json
{
  "response": {
    "success": true,
    "verification_code": "1234",
    "fare_details": { "total_amount": 1250, "payable_amount": 1250 },
    "driver_details": { ... }
  }
}
```

### 2.6 Reschedule - Confirm

**POST** `/partner/mmt/partnerrescheduleconfirmendpoint`

Commits the reschedule. **Note**: Does not require time in body; uses the time validated in the Block step.

**Request Body:**

```json
{
  "order_reference_number": "DK-BOOKING-ID-OR-MMT-ID"
}
```

---

## 3. Outbound APIs (Drivers Klub → MMT)

We will call your webhook endpoints to update trip status.

- `POST /driver-assigned`: Driver & Vehicle details.
- `POST /arrived`: Driver at pickup.
- `POST /start`: GPS Trip started.
- `POST /pickup`: Customer onboarded.
- `POST /alight`: Trip completed.
- `POST /not_boarded`: No-show.
- `POST /update-location`: Live GPS coordinates.

---

## 4. Testing & Support

- **Postman Collection**: [Link to Collection - if available]
- **Support Contact**: [support-email]
- **UAT Environment**: [UAT URL]

> [!TIP]
> Use the endpoint `/partner/mmt/booking/details?partner_reference_number=...` to poll the status of any booking explicitly if webhooks are missed.
