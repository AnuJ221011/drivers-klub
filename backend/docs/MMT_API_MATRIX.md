# MMT Partner API Integration – Endpoint Matrix

This document outlines the API endpoints for the MMT (MakeMyTrip) integration, categorized by direction (Inbound vs. Outbound).

## Inbound (MMT → Us)

These endpoints are exposed by our system for MMT to consume.

| Direction | Method | Endpoint / Resource | Purpose |
| :--- | :--- | :--- | :--- |
| Inbound (MMT → Us) | POST | `/partner/mmt/partnersearchendpoint` | Check trip availability and fare pricing. |
| Inbound (MMT → Us) | POST | `/partner/mmt/partnerblockendpoint` | Reserve inventory (pre-booking / temporary hold). |
| Inbound (MMT → Us) | POST | `/partner/mmt/partnerpaidendpoint` | Confirm booking after successful payment. |
| Inbound (MMT → Us) | POST | `/partner/mmt/partnercancelendpoint` | Cancel booking and trigger refund workflow. |
| Inbound (MMT → Us) | POST | `/partner/mmt/partnerrescheduleblockendpoint` | Validate reschedule request and check availability. |
| Inbound (MMT → Us) | POST | `/partner/mmt/partnerrescheduleconfirmendpoint` | Confirm reschedule and update booking. |
| Inbound (MMT → Us) | GET | `/partner/mmt/booking/details` | Poll latest booking status and details. |

## Outbound (Us → MMT)

These endpoints are called by our system to push updates to MMT.

| Direction | Method | Endpoint / Resource | Purpose |
| :--- | :--- | :--- | :--- |
| Outbound (Us → MMT) | POST | `/driver-assigned` | Push assigned driver and vehicle details. |
| Outbound (Us → MMT) | POST | `/arrived` | Notify that driver has arrived at pickup location. |
| Outbound (Us → MMT) | POST | `/start` | Trip started (GPS latch / ignition start). |
| Outbound (Us → MMT) | POST | `/pickup` | Passenger onboard confirmation (OTP verified). |
| Outbound (Us → MMT) | POST | `/alight` | Trip completed and billing finalized. |
| Outbound (Us → MMT) | POST | `/not_boarded` | Customer marked as No-Show. |
| Outbound (Us → MMT) | POST | `/update-location` | Push live driver GPS location updates. |
| Outbound (Us → MMT) | POST | `/reassign-chauffeur` | Notify driver reassignment by operations team. |
| Outbound (Us → MMT) | POST | `/detach-trip` | Driver unassigned or trip cancelled by Ops. |
