
import { prisma } from "@driversklub/database";
import { ApiError, logger } from "@driversklub/common";
import axios from "axios";
import {
    RapidoOrderStatusCallbackDto,
    RapidoCaptainStatusCallbackDto,
    RapidoChangeCaptainStatusRequestDto,
    RapidoOrderStatus
} from "./rapido.dto.js";
import { ProviderType, TripStatus, ProviderRideStatus, AssignmentStatus } from "@prisma/client";

export class RapidoService {

    private getHeaders() {
        return {
            'apiKey': process.env.RAPIDO_API_KEY || '',
            'Content-Type': 'application/json'
        };
    }

    private getBaseUrl() {
        return process.env.RAPIDO_BASE_URL || 'https://gateway.rapido.bike/api/v1/fleet';
    }

    // Map Rapido Status to Internal Status
    private mapStatus(rapidoStatus: RapidoOrderStatus): { tripStatus: TripStatus, providerStatus: ProviderRideStatus } {
        switch (rapidoStatus) {
            case 'accepted':
            case 'arrived':
                return { tripStatus: "DRIVER_ASSIGNED", providerStatus: "DRIVER_ASSIGNED" };
            case 'started':
                return { tripStatus: "STARTED", providerStatus: "STARTED" };
            case 'dropped':
                return { tripStatus: "COMPLETED", providerStatus: "COMPLETED" };
            case 'customerCancelled':
            case 'riderCancelled':
                return { tripStatus: "CANCELLED", providerStatus: "CANCELLED" };
            case 'aborted':
            case 'reassigned':
                return { tripStatus: "CANCELLED_BY_PARTNER", providerStatus: "CANCELLED" };
            default:
                return { tripStatus: "CREATED", providerStatus: "BOOKED" };
        }
    }

    async handleOrderStatusUpdate(dto: RapidoOrderStatusCallbackDto) {
        // 1. Find Driver
        const driver = await prisma.driver.findFirst({
            where: { mobile: dto.phone },
            include: { user: true }
        });

        if (!driver) {
            console.warn(`Rapido Callback: Driver with phone ${dto.phone} not found.`);
            // Cannot process if no driver
            throw new ApiError(404, "Driver not found");
        }

        // 2. Find or Create Ride
        // We look for a ride with this providerBookingId
        let ride = await prisma.ride.findFirst({
            where: { providerBookingId: dto.orderId, provider: 'RAPIDO' }
        });

        const { tripStatus, providerStatus } = this.mapStatus(dto.status);

        const lat = (val: string | number) => typeof val === 'string' ? parseFloat(val) : val;

        if (!ride) {
            // New Ride
            ride = await prisma.ride.create({
                data: {
                    tripType: 'INTER_CITY', // Defaulting as placeholder
                    originCity: 'Unknown',
                    destinationCity: 'Unknown',
                    pickupTime: new Date(),
                    distanceKm: (dto.estimatedDistance || 0) / 1000,
                    billableKm: Math.ceil((dto.estimatedDistance || 0) / 1000),
                    price: dto.tripFare || 0,
                    status: tripStatus,
                    provider: 'RAPIDO',
                    providerBookingId: dto.orderId,
                    providerStatus: 'CONFIRMED',
                    providerRideStatus: providerStatus,
                    pickupLat: lat(dto.pickupLocation.lat),
                    pickupLng: lat(dto.pickupLocation.lng),
                    dropLat: lat(dto.dropLocation.lat),
                    dropLng: lat(dto.dropLocation.lng),
                    providerMeta: dto as any,

                    // Create assignments
                    tripAssignments: {
                        create: {
                            driverId: driver.id,
                            status: 'ASSIGNED'
                        }
                    },
                    providerMapping: {
                        create: {
                            providerType: ProviderType.RAPIDO,
                            externalBookingId: dto.orderId,
                            providerStatus: dto.status,
                            rawPayload: dto as any
                        }
                    }
                }
            });
        } else {
            // Update Ride
            const updateData: any = {
                status: tripStatus,
                providerRideStatus: providerStatus,
                providerMeta: dto as any
            };

            if (dto.tripFare) updateData.price = dto.tripFare;
            if (tripStatus === "STARTED" && !ride.startedAt) updateData.startedAt = new Date();
            if (tripStatus === "COMPLETED" && !ride.completedAt) updateData.completedAt = new Date();

            await prisma.ride.update({
                where: { id: ride.id },
                data: updateData
            });

            // Also update mapping
            if (ride.id) {
                await prisma.rideProviderMapping.upsert({
                    where: { rideId: ride.id },
                    update: {
                        providerStatus: dto.status,
                        rawPayload: dto as any
                    },
                    create: {
                        rideId: ride.id,
                        providerType: ProviderType.RAPIDO,
                        externalBookingId: dto.orderId,
                        providerStatus: dto.status,
                        rawPayload: dto as any
                    }
                });
            }
        }

        // 3. Trigger Status Sync if Trip Ended
        // We do this by calling sync, but we also check pending queue first.
        if (["COMPLETED", "CANCELLED", "CANCELLED_BY_PARTNER"].includes(tripStatus)) {

            // CHECK QUEUE FIRST
            const meta = driver.providerMetadata as any;
            if (meta?.rapido?.pendingStatus) {
                const pendingStatus = meta.rapido.pendingStatus;
                logger.info(`[Rapido Service] Found pending queue status: ${pendingStatus}. Executing now.`, { driverId: driver.id });

                // Clear metadata first to avoid loops
                await prisma.driver.update({
                    where: { id: driver.id },
                    data: {
                        providerMetadata: {
                            ...meta,
                            rapido: { ...meta.rapido, pendingStatus: undefined, pendingReason: undefined }
                        }
                    }
                });

                // Execute
                try {
                    await this.changeCaptainStatusRequest(driver.id, pendingStatus);
                    logger.info(`[Rapido Service] Processed queue successfully.`);
                } catch (e: any) {
                    logger.error(`[Rapido Service] Failed to process queue: ${e.message}`);
                }
            } else {
                // Normal Sync
                this.validateAndSyncRapidoStatus(driver.id, "RAPIDO_TRIP_END").catch(err => {
                    console.error(`[Rapido Service] Failed to sync status after trip end:`, err);
                });
            }
        }

        return { success: true };
    }

    async handleCaptainStatusCallback(dto: RapidoCaptainStatusCallbackDto) {
        const driver = await prisma.driver.findFirst({
            where: { mobile: dto.phone }
        });

        if (!driver) throw new ApiError(404, "Driver not found");

        // Update driver status
        // DISABLE AUTOMATIC AVAILABILITY UPDATE FROM RAPIDO
        // We want to control this based on internal logic.
        /*
        await prisma.driver.update({
            where: { id: driver.id },
            data: {
                isAvailable: dto.status === 'online'
            }
        });
        */

        // MANUAL OVERRIDE DETECTION
        // If driver manually goes ONLINE, we must check if they are allowed to be online.
        if (dto.status === 'online') {
            logger.info(`[Rapido Webhook] Driver manually went ONLINE. Verifying eligibility...`, { phone: dto.phone });
            // We trigger sync. If they should be offline, validateAndSyncRapidoStatus will force them offline.
            // We use setTimeout to avoid blocking the webhook response, or just await it if fast enough.
            // Awaiting is safer to ensure we capture checking errors.
            await this.validateAndSyncRapidoStatus(driver.id, "MANUAL_OVERRIDE_CHECK");
        }

        return { success: true };
    }

    async changeCaptainStatusRequest(driverId: string, status: 'online' | 'offline', vehicleNo?: string) {
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            include: {
                fleet: true,
                assignments: { where: { status: 'ACTIVE' }, include: { vehicle: true } },
                tripAssignments: { where: { status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE] } }, include: { trip: true } }
            }
        });

        if (!driver) throw new ApiError(404, "Driver not found");

        const payload: RapidoChangeCaptainStatusRequestDto = {
            status,
            captainMobile: driver.mobile,
            vehicleNo: vehicleNo
        };

        // SAFETY CHECK: Cannot go online if on an active internal trip
        if (status === 'online') {
            const driverWithRelations = driver as any;
            const activeInternalTrip = driverWithRelations.tripAssignments?.find((ta: any) => ta.trip.provider === ProviderType.INTERNAL && [AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE].includes(ta.status));
            if (activeInternalTrip) {
                throw new ApiError(400, "Cannot switch to Rapido while on an active internal trip.");
            }
        }

        if (status === 'online' && !vehicleNo) {
            // We know assignments and tripAssignments are populated because of the include above
            const driverWithRelations = driver as any;
            const assignment = driverWithRelations.assignments?.[0];
            if (assignment) {
                payload.vehicleNo = assignment.vehicle.vehicleNumber;
            } else {
                throw new ApiError(400, "Vehicle Number required for ONLINE status");
            }
        }

        try {
            // Using logic: PUT .../captain_status/{mobile} based on example
            const requestUrl = `${this.getBaseUrl()}/captain_status/${driver.mobile}`;

            const response = await axios.put(requestUrl, payload, {
                headers: this.getHeaders()
            });

            // On success, clear any existing retry metadata for this status
            const meta = driver.providerMetadata as any;
            if (meta?.rapido?.retryStatus === status) {
                await prisma.driver.update({
                    where: { id: driver.id },
                    data: {
                        providerMetadata: {
                            ...meta,
                            rapido: { ...meta.rapido, retryStatus: undefined, retryCount: undefined, lastError: undefined }
                        }
                    }
                });
            }

            return response.data;
        } catch (error: any) {
            // Retry Logic: Save failure to metadata for worker to pick up
            if (status) { // Only specific status changes are critical
                const meta = (driver.providerMetadata as any) || {};
                const rapidoMeta = meta.rapido || {};
                const currentCount = rapidoMeta.retryCount || 0;

                // Only retry max 5 times to avoid infinite zombie loops
                if (currentCount < 5) {
                    await prisma.driver.update({
                        where: { id: driver.id },
                        data: {
                            providerMetadata: {
                                ...meta,
                                rapido: {
                                    ...rapidoMeta,
                                    retryStatus: status, // The status we failed to set
                                    retryCount: currentCount + 1,
                                    lastError: error.message || "Unknown Error",
                                    lastRetryAt: new Date().toISOString()
                                }
                            }
                        }
                    });
                    logger.warn(`[Rapido Service] API Failed. Queued for retry (${currentCount + 1}/5).`, { driverId });
                } else {
                    logger.error(`[Rapido Service] API Failed. Max Retries Reached. Giving up.`, { driverId });
                }
            }

            throw new ApiError(error.response?.status || 500, error.response?.data?.message || error.message);
        }
    }

    async processRetryQueue() {
        // Query drivers with pending retry counts in metadata
        const failedDrivers = await prisma.driver.findMany({
            where: {
                providerMetadata: {
                    path: ['rapido', 'retryCount'],
                    gt: 0
                }
            }
        });

        logger.info(`[Rapido Retry] Processing ${failedDrivers.length} pending retries...`);

        for (const driver of failedDrivers) {
            const meta = driver.providerMetadata as any;
            const statusToRetry = meta?.rapido?.retryStatus as 'online' | 'offline';

            if (statusToRetry) {
                logger.info(`[Rapido Retry] Retrying ${statusToRetry} for driver ${driver.id}`);
                try {
                    // Calculate if we should still do it? 
                    // Ideally yes, but maybe state changed?
                    // safer to trigger validateAndSync to re-evaluate everything?
                    // If we trigger validateAndSync, it will re-calculate desired status and call changeCaptainStatusRequest.
                    // If it succeeds, it clears metadata. Ideally.
                    await this.validateAndSyncRapidoStatus(driver.id, "RETRY_WORKER");
                } catch (e) {
                    // logic inside validateAndSync handles error logging.
                }
            }
        }
    }
    async validateAndSyncRapidoStatus(driverId: string, triggerEvent: string) {
        logger.info(`[Rapido Sync] Triggered`, { driverId, triggerEvent });
        const bufferMinutes = parseInt(process.env.RAPIDO_PRE_TRIP_BUFFER_MINUTES || '45', 10);
        const bufferMs = bufferMinutes * 60 * 1000;
        const now = new Date();
        const bufferWindow = new Date(now.getTime() + bufferMs);

        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            include: {
                assignments: {
                    where: { status: 'ACTIVE' },
                    include: { vehicle: true }
                },
                tripAssignments: {
                    where: {
                        status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE] }
                    },
                    include: { trip: true }
                },
                attendance: {
                    where: {
                        checkInTime: { lte: now },
                        OR: [
                            { checkOutTime: null },
                            { checkOutTime: { gt: now } }
                        ]
                    },
                    include: { breaks: true }
                }
            }
        });

        if (!driver) {
            logger.warn(`[Rapido Sync] Driver not found`, { driverId });
            return;
        }

        const driverWithRelations = driver as any;

        // --- Step 1: Calculate Desired Status (Internal Logic) ---
        let desiredStatus: 'online' | 'offline' = 'online';
        let reason = "Default available";

        // 1. Check for ANY Active External/Internal Trip (Not Rapido)
        // If driver is on MMT, MojoBoxx, or Internal trip -> They must be OFFLINE on Rapido
        // We check for any trip that is NOT Rapido and is in a "Busy" state.
        const activeNonRapidoTrip = driverWithRelations.tripAssignments?.find((ta: any) =>
            ta.trip.provider !== ProviderType.RAPIDO &&
            ta.trip.status === 'STARTED'
        );

        if (activeNonRapidoTrip) {
            desiredStatus = 'offline';
            reason = `Busy on ${activeNonRapidoTrip.trip.provider} Trip`;
        }

        // 2. Upcoming Internal Trip (Within Buffer) -> OFFLINE
        // We find ACTIVE assignments where trip is CREATED/ASSIGNED and pickup is soon.
        // Step 1 check covers STARTED. This covers FUTURE.
        const upcomingAssignment = driverWithRelations.tripAssignments?.find((ta: any) =>
            ['CREATED', 'driver_assigned'].includes(ta.trip.status) &&
            new Date(ta.trip.pickupTime).getTime() <= bufferWindow.getTime() &&
            new Date(ta.trip.pickupTime).getTime() >= now.getTime()
        );

        if (upcomingAssignment) {
            desiredStatus = 'offline';
            reason = "Upcoming Trip";
        }

        // 3. Current Shift Break Rules (Attendance) -> OFFLINE
        const activeAttendance = driverWithRelations.attendance?.[0]; // Current active attendance
        if (activeAttendance) {
            const activeBreak = activeAttendance.breaks?.find((b: any) => !b.endTime);
            if (activeBreak) {
                desiredStatus = 'offline';
                reason = "On Break";
            }
        } else {
            // If not checked in, they should probably be offline?
            // Or we respect manual? For now, let's assume if no attendance, we force offline?
            // Policy: Must be Checked In to be Online on Rapido.
            desiredStatus = 'offline';
            reason = "Not Checked In";
        }

        // --- Step 2: Check Active Rapido Trip Conflict (Queue Logic) ---
        // If we want to change to OFFLINE, but they are BUSY on Rapido, we must QUEUE.
        const activeRapidoTrip = driverWithRelations.tripAssignments?.find((ta: any) =>
            ta.trip.provider === ProviderType.RAPIDO &&
            ['STARTED', 'DRIVER_ASSIGNED'].includes(ta.trip.status)
        );

        if (activeRapidoTrip) {
            if (desiredStatus === 'offline') {
                logger.info(`[Rapido Sync] Driver busy on Rapido. Queuing OFFLINE status.`, { driverId, reason });

                // Update Metadata with Pending Status
                // Fetch current meta first to preserve other keys
                const meta = driver.providerMetadata as any || {};
                const rapidoMeta = meta.rapido || {};

                await prisma.driver.update({
                    where: { id: driverId },
                    data: {
                        providerMetadata: {
                            ...meta,
                            rapido: {
                                ...rapidoMeta,
                                pendingStatus: 'offline',
                                pendingReason: reason
                            }
                        }
                    }
                });
            } else {
                logger.info(`[Rapido Sync] Driver busy on Rapido. Status unchanged (Online).`, { driverId });
            }
            return;
        }

        // --- Step 3: Execute Change (If not busy on Rapido) ---
        logger.info(`[Rapido Sync] Decision`, { driverId, desiredStatus, reason });

        try {
            await this.changeCaptainStatusRequest(driver.id, desiredStatus);
            logger.info(`[Rapido Sync] Successfully updated status`, { driverId, status: desiredStatus });
        } catch (error: any) {
            logger.error(`[Rapido Sync] Failed to set status`, { driverId, error: error.message });
        }
    }
}
