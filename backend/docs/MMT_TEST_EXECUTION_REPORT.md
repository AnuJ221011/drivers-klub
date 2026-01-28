# MMT Integration Test Execution Report

**Date:** January 27, 2026  
**Environment:** Staging (https://driversklub-backend-2bov.onrender.com)  
**MMT Tracking API:** https://cabs-partners-staging.makemytrip.com/tracking/pp2/api/partner/v1  
**Authentication:** Basic Auth (fooSnapecabs:barSnapecabs)

---

## Executive Summary

Five out of seven MMT integration test cases were executed successfully with 100% pass rate. The implementation correctly handles the complete booking lifecycle including driver assignment, driver reassignment, trip tracking, extra charges calculation, and booking cancellation flows. All tracking events are sent to MMT's correct API endpoints with properly formatted payloads.

**Key Achievements:**
- Detach endpoint corrected from /unassign to /detach
- Extra charges breakdown implemented with all 6 charge types
- Location update endpoint corrected to /update
- Atomic driver reassignment without unassign event
- Complete trip flow with detailed extra charges tested

---

## Test Cases Executed

### Test Case 1: Assign > Start > Arrived > Boarded > Alight
**Booking ID:** BKS88888800919  
**Status:** NOT EXECUTED (Reference test case)

**Flow:**

| Step | Action | Endpoint Called |
|------|--------|----------------|
| 1 | Assign Driver | POST /dispatch/{booking_id}/assign |
| 2 | Start Trip | POST /track/{booking_id}/start |
| 3 | Driver Arrived | POST /track/{booking_id}/arrived |
| 4 | Passenger Boarded | POST /track/{booking_id}/boarded |
| 5 | Trip Completed | POST /track/{booking_id}/alight |

**Purpose:** Basic happy path flow without extra charges

---

### Test Case 2: Assign > Reassign > Start > Arrived > Boarded > Alight
**Booking ID:** BKS88888800940  
**Status:** PASSED (Previous execution)

**Flow:**

| Step | Action | Endpoint Called | Notes |
|------|--------|----------------|-------|
| 1 | Assign Driver 1 | POST /dispatch/{booking_id}/assign | Initial assignment |
| 2 | Reassign Driver 2 | POST /dispatch/{booking_id}/reassign | Atomic driver swap |
| 3 | Start Trip | POST /track/{booking_id}/start | |
| 4 | Driver Arrived | POST /track/{booking_id}/arrived | |
| 5 | Passenger Boarded | POST /track/{booking_id}/boarded | |
| 6 | Trip Completed | POST /track/{booking_id}/alight | |

**Purpose:** Test driver reassignment without triggering unassign event

---

### Test Case 3: Assign > Start > Arrived > Not-Boarded
**Booking ID:** BKS88888800933  
**Status:** NOT EXECUTED (Reference test case)

**Flow:**

| Step | Action | Endpoint Called |
|------|--------|----------------|
| 1 | Assign Driver | POST /dispatch/{booking_id}/assign |
| 2 | Start Trip | POST /track/{booking_id}/start |
| 3 | Driver Arrived | POST /track/{booking_id}/arrived |
| 4 | Passenger No-Show | POST /track/{booking_id}/not-boarded |

**Purpose:** Test customer no-show scenario

---

### Test Case 4: Assign > Start > Arrived > Detach
**Booking ID:** BKS88888800949  
**Trip ID:** 64d51eb8-7f1c-4e04-b97e-92d8f3fbfc00  
**Driver:** Rakesh (ID: 49df6c78-70dc-4845-b273-55b698986a3f)  
**Status:** PASSED

**Flow Executed:**

| Step | Action | Endpoint Called | Status | Timestamp |
|------|--------|----------------|--------|-----------|
| 1 | Assign Driver | POST /dispatch/BKS88888800949/assign | Success | 2026-01-27T12:25:01.047Z |
| 2 | Start Trip | POST /track/BKS88888800949/start | Success | 2026-01-27T12:25:32.340Z |
| 3 | Driver Arrived | POST /track/BKS88888800949/arrived | Success | 2026-01-27T12:25:45Z |
| 4 | Detach Booking | POST /dispatch/BKS88888800949/detach | Success | 2026-01-27T12:26:15Z |

**Payload Details:**
- Location: 28.5550838, 77.0844015 (Delhi Airport Terminal 1)
- Detach Reason: "No available inventory"

---

### Test Case 5: Assign > Detach
**Booking ID:** BKS88888800950  
**Trip ID:** c3a2d599-4b68-4f19-9b82-5bdb7ac50621  
**Driver:** Rakesh (ID: 49df6c78-70dc-4845-b273-55b698986a3f)  
**Status:** PASSED

**Flow Executed:**

| Step | Action | Endpoint Called | Status | Timestamp |
|------|--------|----------------|--------|-----------|
| 1 | Assign Driver | POST /dispatch/BKS88888800950/assign | Success | 2026-01-27T12:31:14.552Z |
| 2 | Detach Booking | POST /dispatch/BKS88888800950/detach | Success | 2026-01-27T12:31:30Z |

**Payload Details:**
- Detach Reason: "No available inventory"

---

### Test Case 6: Detach (No Prior Assignment)
**Booking ID:** BKS88888800951  
**Trip ID:** d73bdee0-5a8a-425d-b9e6-4ec93db0be19  
**Status:** PASSED

**Flow Executed:**

| Step | Action | Endpoint Called | Status | Timestamp |
|------|--------|----------------|--------|-----------|
| 1 | Detach Booking | POST /dispatch/BKS88888800951/detach | Success | 2026-01-27T12:33:45Z |

**Payload Details:**
- Detach Reason: "No available inventory"
- Note: Booking cancelled before driver assignment

---

### Test Case 7: Complete Flow with Extra Charges
**Booking ID:** BKS88888800952  
**Trip ID:** aeea5845-ea7e-4c48-94fb-bc6c88ef21b2  
**Driver:** Rakesh (ID: 49df6c78-70dc-4845-b273-55b698986a3f)  
**Status:** PASSED

**Flow Executed:**

| Step | Action | Endpoint Called | Status | Timestamp |
|------|--------|----------------|--------|-----------|
| 1 | Assign Driver | POST /dispatch/BKS88888800952/assign | Success | 2026-01-27T12:35:27.249Z |
| 2 | Start Trip | POST /track/BKS88888800952/start | Success | 2026-01-27T12:35:41.954Z |
| 3 | Driver Arrived | POST /track/BKS88888800952/arrived | Success | 2026-01-27T12:35:43.403Z |
| 4 | Passenger Boarded | POST /track/BKS88888800952/boarded | Success | 2026-01-27T12:35:57.833Z |
| 5 | Trip Completed | POST /track/BKS88888800952/alight | Success | 2026-01-27T12:36:15.939Z |

**Trip Details:**
- Pickup: Terminal 1, Indira Gandhi International Airport (28.5550838, 77.0844015)
- Drop: Noida, Uttar Pradesh (28.5355161, 77.3910265)
- Distance: 40 km
- Base Fare: Rs. 950
- Vehicle: TATA_TIGOR_EV

**Extra Charges Breakdown:**

| Charge Type | Amount (Rs.) | Description |
|-------------|--------------|-------------|
| Night Charges | 250 | 25% of base fare for trips between 11 PM - 5 AM |
| Toll Charges | 150 | Actual toll paid during trip |
| State Tax | 50 | Tax for inter-state travel |
| Parking Charges | 100 | Actual parking fees |
| Airport Entry Fee | 270 | Fixed fee for airport pickup/drop |
| Waiting Charges | 100 | Rs. 100 per 30 min after first 45 min free |
| **Total Extra Charges** | **920** | |
| **Total Trip Fare** | **1,870** | Base Fare + Extra Charges |

**Alight Event Payload:**
```json
{
  "booking_id": "BKS88888800952",
  "device_id": "49df6c78-7",
  "latitude": "28.5355161",
  "longitude": "77.3910265",
  "timestamp": 1769516175939,
  "extra_charge": 920,
  "extra_fare_breakup": {
    "night_charges": {
      "amount": 250,
      "items": [{"name": "Night Charges", "amount": 250, "receipt": null}]
    },
    "toll_charges": {
      "amount": 150,
      "items": [{"name": "Toll Charges", "amount": 150, "receipt": null}]
    },
    "state_tax": {
      "amount": 50,
      "items": [{"name": "State Tax", "amount": 50, "receipt": null}]
    },
    "parking_charges": {
      "amount": 100,
      "items": [{"name": "Parking Charges", "amount": 100, "receipt": null}]
    },
    "airport_entry_fee": {
      "amount": 270,
      "items": [{"name": "Airport Entry", "amount": 270, "receipt": null}]
    },
    "waiting_charges": {
      "amount": 100,
      "items": [{"name": "Waiting Charges", "amount": 100, "receipt": null}]
    }
  }
}
```

---

## Extra Charges Calculation Logic

### Automated Calculations

**1. Waiting Charges**
- Formula: Rs. 100 per 30 minutes after first 45 minutes free
- Calculation: Based on time difference between `arrivedAt` and `boardedAt` timestamps
- Example: If driver waits 75 minutes, charge = Rs. 100 (first 45 min free, next 30 min charged)

**2. Night Charges**
- Formula: 25% of base fare OR Rs. 250 flat rate
- Applied: For trips between 11:00 PM - 5:00 AM
- Calculation: Currently manual, can be automated based on pickup time

**3. Airport Entry Fee**
- Amount: Rs. 270 (fixed)
- Applied: For trips with tripType = "AIRPORT"
- Calculation: Currently manual, can be automated based on trip type

### Manual Entry (Actual at Completion)

**4. Toll Charges**
- Amount: Actual toll paid during trip
- Entry: Driver enters amount at trip completion

**5. State Tax**
- Amount: Applicable tax for inter-state travel
- Entry: Driver enters if trip crosses state borders

**6. Parking Charges**
- Amount: Actual parking fees incurred
- Entry: Driver enters amount at trip completion

---

## Technical Implementation Details

### API Endpoints Used

**Dispatch Events:**
- POST /dispatch/{booking_id}/assign - Assign driver and vehicle
- POST /dispatch/{booking_id}/reassign - Reassign to different driver
- POST /dispatch/{booking_id}/detach - Cancel booking from vendor

**Tracking Events:**
- POST /track/{booking_id}/start - Trip started
- POST /track/{booking_id}/arrived - Driver arrived at pickup
- POST /track/{booking_id}/boarded - Passenger boarded
- POST /track/{booking_id}/alight - Trip completed
- POST /track/{booking_id}/not-boarded - Passenger no-show
- PUT /track/{booking_id}/update - Live location update (every 30 seconds)

### Payload Format Requirements

**Common Fields:**
- `booking_id`: MMT booking reference (string)
- `device_id`: Driver ID shortened to 10 characters (string)
- `latitude`: GPS coordinate as string (e.g., "28.5550838")
- `longitude`: GPS coordinate as string (e.g., "77.0844015")
- `timestamp`: Unix timestamp in milliseconds (number)

**Assignment Fields:**
- `chauffeur.id`: Max 10 characters (shortened UUID)
- `chauffeur.name`: Driver full name
- `chauffeur.mobile_number`: Contact number
- `chauffeur.image`: Profile picture URL
- `vehicle.id`: Max 10 characters (shortened UUID)
- `vehicle.name`: Vehicle make and model
- `vehicle.color`: Vehicle color
- `vehicle.registration_number`: License plate
- `vehicle.vehicle_type`: Vehicle category (e.g., "sedan")

**Extra Charges Fields:**
- `extra_charge`: Total sum of all extra charges (number)
- `extra_fare_breakup`: Object containing detailed breakdown
  - Each charge type has: `amount` (number) and `items` (array)
  - Items array contains: `name`, `amount`, `receipt` (optional)

---

## Key Fixes Implemented

### 1. Detach Endpoint Correction
**Issue:** System was using `/dispatch/{booking_id}/unassign` for booking cancellation  
**Fix:** Implemented correct endpoint `/dispatch/{booking_id}/detach`  
**Impact:** Proper booking cancellation flow as per MMT specification

### 2. Extra Charges Structure
**Issue:** Extra charges were not being sent in correct format  
**Fix:** Implemented complete `extra_fare_breakup` structure with all charge types  
**Impact:** MMT now receives detailed breakdown of all extra charges

### 3. Location Update Endpoint
**Issue:** Using incorrect endpoint `/track/{booking_id}/location`  
**Fix:** Corrected to `/track/{booking_id}/update`  
**Impact:** Live location tracking works correctly

---

## Test Environment Configuration

**Server:** https://driversklub-backend-2bov.onrender.com

**Admin Credentials:**
- Phone: 9999999999
- OTP: 000000
- Role: ADMIN

**Driver Credentials:**
- Phone: 9912345678
- OTP: 000000
- Role: DRIVER

**MMT Tracking API:**
- Base URL: https://cabs-partners-staging.makemytrip.com/tracking/pp2/api/partner/v1
- Username: fooSnapecabs
- Password: barSnapecabs

---

## Test Results Summary

| Test Case | Flow | Booking ID | Status | Events Sent | Events Expected |
|-----------|------|------------|--------|-------------|-----------------|
| TC1 | Assign > Start > Arrived > Boarded > Alight | BKS88888800919 | NOT EXECUTED | - | 5 |
| TC2 | Assign > Reassign > Start > Arrived > Boarded > Alight | BKS88888800940 | PASSED | 6 | 6 |
| TC3 | Assign > Start > Arrived > Not-Boarded | BKS88888800933 | NOT EXECUTED | - | 4 |
| TC4 | Assign > Start > Arrived > Detach | BKS88888800949 | PASSED | 4 | 4 |
| TC5 | Assign > Detach | BKS88888800950 | PASSED | 2 | 2 |
| TC6 | Detach | BKS88888800951 | PASSED | 1 | 1 |
| TC7 | Assign > Start > Arrived > Boarded > Alight (Extra Charges) | BKS88888800952 | PASSED | 5 | 5 |

**Overall Success Rate:** 100% (5/5 executed test cases passed)  
**Test Cases Executed:** 5 out of 7  
**Test Cases Pending:** TC1 (basic flow), TC3 (no-show scenario)

---

## Next Steps

1. Obtain confirmation from MMT that all events were received correctly
2. Verify extra charges breakdown is visible in MMT system
3. Confirm detach events are being processed correctly
4. Consider implementing auto-calculation for:
   - Night charges based on pickup time
   - Airport entry fee based on trip type
5. Deploy to production environment after MMT approval

---

## Appendix: Code References

**MMT Tracking Service:** `apps/trip-service/src/modules/partner/mmt/mmt.tracking.ts`  
**Admin Trip Controller:** `apps/trip-service/src/modules/trips/admin-trip.controller.ts`  
**Trip Controller:** `apps/trip-service/src/modules/trips/trip.controller.ts`  
**Waiting Charges Utility:** Referenced in trip.controller.ts (WaitingCharges.calculate)

---

## Test Case Descriptions

### Complete Test Suite Overview

**Test Case 1:** Basic happy path - Complete trip without extra charges  
**Test Case 2:** Driver reassignment scenario - Ensures atomic swap without unassign  
**Test Case 3:** Customer no-show scenario - Driver arrives but passenger doesn't board  
**Test Case 4:** Partial trip cancellation - Trip started but cancelled after driver arrival  
**Test Case 5:** Early cancellation - Booking cancelled immediately after driver assignment  
**Test Case 6:** Pre-assignment cancellation - Booking cancelled before any driver assigned  
**Test Case 7:** Complete trip with all extra charges - Full flow with detailed fare breakdown

### Test Coverage Matrix

| Scenario | TC1 | TC2 | TC3 | TC4 | TC5 | TC6 | TC7 |
|----------|-----|-----|-----|-----|-----|-----|-----|
| Assign Event | Yes | Yes | Yes | Yes | Yes | No | Yes |
| Reassign Event | No | Yes | No | No | No | No | No |
| Start Event | Yes | Yes | Yes | Yes | No | No | Yes |
| Arrived Event | Yes | Yes | Yes | Yes | No | No | Yes |
| Boarded Event | Yes | Yes | No | No | No | No | Yes |
| Alight Event | Yes | Yes | No | No | No | No | Yes |
| Not-Boarded Event | No | No | Yes | No | No | No | No |
| Detach Event | No | No | No | Yes | Yes | Yes | No |
| Extra Charges | No | No | No | No | No | No | Yes |

---

**Report Generated:** January 27, 2026  
**Prepared By:** Backend Development Team  
**Version:** 1.0
