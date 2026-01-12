// import {
//   DEFAULT_DRIVER_PREFERENCE,
//   type DriverPreference,
//   type DriverPreferenceChangeRequest,
//   type DriverPreferenceKey,
// } from '../models/driver/driverPreferences';

// export type UpdateDriverPreferenceRequestStatusInput =
//   | { id: string; status: 'APPROVED' }
//   | { id: string; status: 'REJECTED'; rejection_reason: string };

// const STORAGE_KEYS = {
//   driverPrefs: 'dk_mock_driver_prefs_v1',
//   requests: 'dk_mock_driver_pref_requests_v1',
// } as const;

// function isBrowser(): boolean {
//   return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
// }

// function safeParseJson<T>(raw: string | null): T | null {
//   if (!raw) return null;
//   try {
//     return JSON.parse(raw) as T;
//   } catch {
//     return null;
//   }
// }

// function nowIso(): string {
//   return new Date().toISOString();
// }

// function uuid(): string {
//   // Browser-friendly UUID generator with fallback
//   const c = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
//   if (c.crypto?.randomUUID) return c.crypto.randomUUID();
//   return `mock_${Math.random().toString(16).slice(2)}_${Date.now()}`;
// }

// type StoredPrefs = Record<string, DriverPreference>;

// function readStoredPrefs(): StoredPrefs {
//   if (!isBrowser()) return {};
//   const parsed = safeParseJson<StoredPrefs>(window.localStorage.getItem(STORAGE_KEYS.driverPrefs));
//   return parsed && typeof parsed === 'object' ? parsed : {};
// }

// function writeStoredPrefs(next: StoredPrefs) {
//   if (!isBrowser()) return;
//   window.localStorage.setItem(STORAGE_KEYS.driverPrefs, JSON.stringify(next));
// }

// function readStoredRequests(): DriverPreferenceChangeRequest[] {
//   if (!isBrowser()) return [];
//   const parsed = safeParseJson<DriverPreferenceChangeRequest[]>(
//     window.localStorage.getItem(STORAGE_KEYS.requests),
//   );
//   return Array.isArray(parsed) ? parsed : [];
// }

// function writeStoredRequests(next: DriverPreferenceChangeRequest[]) {
//   if (!isBrowser()) return;
//   window.localStorage.setItem(STORAGE_KEYS.requests, JSON.stringify(next));
// }

// function ensureSeedData() {
//   if (!isBrowser()) return;
//   const existing = readStoredRequests();
//   const existingPrefs = readStoredPrefs();
//   if (existing.length > 0) return;

//   const driverId = 'ad8324ca-2dea-4618-ba5e-3095fa123d06';
//   const current = existingPrefs[driverId] || { ...DEFAULT_DRIVER_PREFERENCE };

//   const seededPending: DriverPreferenceChangeRequest = {
//     id: 'bd3c2df9-d58d-4b5a-8d20-2ecd8db1b63e',
//     driverId,
//     currentPreference: current,
//     requestedPreference: {
//       accept_rentals: true,
//       auto_assign_rides: true,
//       prefer_airport_rides: true,
//     },
//     status: 'PENDING',
//     requestAt: '2026-01-08T04:38:38.415Z',
//     reviewedAt: null,
//     reviewedBy: null,
//     rejectionReason: null,
//   };

//   const seededApproved: DriverPreferenceChangeRequest = {
//     id: 'mock_approved_1',
//     driverId,
//     currentPreference: current,
//     requestedPreference: {
//       prefer_short_trips: true,
//     },
//     status: 'APPROVED',
//     requestAt: '2026-01-07T12:10:00.000Z',
//     reviewedAt: '2026-01-07T12:20:00.000Z',
//     reviewedBy: '1',
//     rejectionReason: null,
//   };

//   const seededRejected: DriverPreferenceChangeRequest = {
//     id: 'mock_rejected_1',
//     driverId,
//     currentPreference: current,
//     requestedPreference: {
//       auto_deduct_loans: true,
//     },
//     status: 'REJECTED',
//     requestAt: '2026-01-06T09:05:00.000Z',
//     reviewedAt: '2026-01-06T09:20:00.000Z',
//     reviewedBy: '1',
//     rejectionReason: 'demo test',
//   };

//   writeStoredRequests([seededPending, seededApproved, seededRejected]);
//   writeStoredPrefs({ ...existingPrefs, [driverId]: current });
// }

// export async function prefGetDriverPreference(driverId: string): Promise<DriverPreference> {
//   ensureSeedData();
//   const map = readStoredPrefs();
//   return map[driverId] || { ...DEFAULT_DRIVER_PREFERENCE };
// }

// export async function prefGetPendingRequests(): Promise<DriverPreferenceChangeRequest[]> {
//   ensureSeedData();
//   return readStoredRequests().filter((r) => r.status === 'PENDING');
// }

// export async function prefGetAllRequests(): Promise<DriverPreferenceChangeRequest[]> {
//   ensureSeedData();
//   const local = readStoredRequests();
//   return local.sort((a, b) => Number(new Date(b.requestAt)) - Number(new Date(a.requestAt)));
// }

// export async function prefCreatePendingRequest(input: {
//   driverId: string;
//   key: DriverPreferenceKey;
//   value: boolean;
// }): Promise<DriverPreferenceChangeRequest> {
//   // NOTE: Driver-side "create request" endpoint was not provided; we mock it locally.
//   ensureSeedData();
//   const prefsMap = readStoredPrefs();
//   const current = prefsMap[input.driverId] || { ...DEFAULT_DRIVER_PREFERENCE };

//   const req: DriverPreferenceChangeRequest = {
//     id: uuid(),
//     driverId: input.driverId,
//     currentPreference: current,
//     requestedPreference: { [input.key]: input.value } as Partial<DriverPreference>,
//     status: 'PENDING',
//     requestAt: nowIso(),
//     reviewedAt: null,
//     reviewedBy: null,
//     rejectionReason: null,
//   };

//   const existing = readStoredRequests();
//   writeStoredRequests([req, ...existing]);
//   return req;
// }

// export async function prefUpdateRequestStatus(
//   input: UpdateDriverPreferenceRequestStatusInput,
// ): Promise<DriverPreferenceChangeRequest> {
//   ensureSeedData();

//   const existing = readStoredRequests();
//   const idx = existing.findIndex((r) => r.id === input.id);
//   if (idx < 0) throw new Error('Request not found');

//   const prev = existing[idx];
//   const reviewedAt = nowIso();
//   const reviewedBy = '1';
//   const next: DriverPreferenceChangeRequest = {
//     ...prev,
//     status: input.status,
//     reviewedAt,
//     reviewedBy,
//     rejectionReason: input.status === 'REJECTED' ? input.rejection_reason : null,
//   };

//   const nextRequests = [...existing];
//   nextRequests[idx] = next;
//   writeStoredRequests(nextRequests);

//   // Apply changes to driver preferences if approved
//   if (input.status === 'APPROVED') {
//     const prefsMap = readStoredPrefs();
//     const current = prefsMap[next.driverId] || { ...DEFAULT_DRIVER_PREFERENCE };
//     const applied: DriverPreference = { ...current, ...(next.requestedPreference || {}) };
//     writeStoredPrefs({ ...prefsMap, [next.driverId]: applied });
//   }

//   return next;
// }

