import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be defined before imports that use them
vi.mock('../../../utils/prisma.js', () => ({
    prisma: {
        driver: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn()
        },
        ride: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn()
        },
        tripAssignment: {
            findMany: vi.fn()
        },
        rideProviderMapping: {
            update: vi.fn()
        }
    }
}));

vi.mock('../../../utils/logger.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('axios');

import { RapidoService } from './rapido.service.js';
import { prisma } from '../../../utils/prisma.js';
import axios from 'axios';
import { ProviderType } from '@prisma/client';

describe('RapidoService', () => {
    let service: RapidoService;
    const prismaMock = prisma as any;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new RapidoService();

        // Default Config
        process.env.RAPIDO_PRE_TRIP_BUFFER_MINUTES = '45';
        process.env.RAPIDO_API_KEY = 'test-key';
        process.env.RAPIDO_BASE_URL = 'http://mock-api';
    });

    describe('validateAndSyncRapidoStatus', () => {
        const driverId = 'driver-123';
        const now = new Date();

        const baseDriver = {
            id: driverId,
            mobile: '9876543210',
            assignments: [],
            tripAssignments: [],
            attendance: []
        };

        it('should SKIP sync if driver has an ACTIVE RAPIDO trip', async () => {
            prismaMock.driver.findUnique.mockResolvedValue({
                ...baseDriver,
                tripAssignments: [{
                    status: 'ASSIGNED',
                    trip: {
                        provider: ProviderType.RAPIDO,
                        status: 'STARTED',
                        pickupTime: now
                    }
                }]
            });

            await service.validateAndSyncRapidoStatus(driverId, 'TEST');

            // Should NOT call changeCaptainStatusRequest (axios)
            expect(axios.put).not.toHaveBeenCalled();
        });

        it('should go OFFLINE if driver has ACTIVE INTERNAL trip', async () => {
            prismaMock.driver.findUnique.mockResolvedValue({
                ...baseDriver,
                tripAssignments: [{
                    status: 'ASSIGNED',
                    trip: {
                        provider: ProviderType.INTERNAL,
                        status: 'STARTED',
                        pickupTime: now
                    }
                }]
            });

            // Mock successful axios call
            (axios.put as any).mockResolvedValue({ data: {} });

            await service.validateAndSyncRapidoStatus(driverId, 'TEST');

            expect(axios.put).toHaveBeenCalledWith(
                expect.stringContaining('/captain_status/9876543210'),
                expect.objectContaining({ status: 'offline' }),
                expect.anything()
            );
        });

        it('should go OFFLINE if driver is on BREAK', async () => {
            prismaMock.driver.findUnique.mockResolvedValue({
                ...baseDriver,
                attendance: [{
                    breaks: [{
                        startTime: new Date(now.getTime() - 10000), // Started 10s ago
                        endTime: null
                    }]
                }]
            });

            (axios.put as any).mockResolvedValue({ data: {} });

            await service.validateAndSyncRapidoStatus(driverId, 'TEST');

            expect(axios.put).toHaveBeenCalledWith(
                expect.stringContaining('/captain_status/9876543210'),
                expect.objectContaining({ status: 'offline' }),
                expect.anything()
            );
        });

        it('should go OFFLINE if Internal Trip starts within Buffer', async () => {
            // Default 45 mins used from env
            const tripTime = new Date(now.getTime() + 30 * 60 * 1000); // In 30 mins

            prismaMock.driver.findUnique.mockResolvedValue({
                ...baseDriver,
                tripAssignments: [{
                    status: 'ASSIGNED',
                    trip: {
                        provider: ProviderType.INTERNAL,
                        status: 'ASSIGNED', // Not started yet, but assigned
                        pickupTime: tripTime
                    }
                }]
            });

            (axios.put as any).mockResolvedValue({ data: {} });

            await service.validateAndSyncRapidoStatus(driverId, 'TEST');

            expect(axios.put).toHaveBeenCalledWith(
                expect.stringContaining('/captain_status/9876543210'),
                expect.objectContaining({ status: 'offline' }),
                expect.anything()
            );
        });

        it('should go ONLINE if NO conflicts exist', async () => {
            // Driver needs a vehicle to go online
            prismaMock.driver.findUnique.mockResolvedValue({
                ...baseDriver,
                assignments: [{
                    status: 'ACTIVE',
                    vehicle: { vehicleNumber: 'KA01AB1234' }
                }]
            });

            (axios.put as any).mockResolvedValue({ data: {} });

            await service.validateAndSyncRapidoStatus(driverId, 'TEST');

            expect(axios.put).toHaveBeenCalledWith(
                expect.stringContaining('/captain_status/9876543210'),
                expect.objectContaining({
                    status: 'online',
                    vehicleNo: 'KA01AB1234'
                }),
                expect.anything()
            );
        });
    });
});
