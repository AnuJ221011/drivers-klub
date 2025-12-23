/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { getFleets } from '../api/fleet.api';
import type { Fleet } from '../models/fleet/fleet';
import { useAuth } from './AuthContext';
import { getDefaultFleetId } from '../config/defaults';

const ACTIVE_FLEET_KEY = 'dk_active_fleet_id';

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function normalizeFleetId(v: string | null | undefined): string | null {
  const trimmed = (v || '').trim();
  if (!trimmed) return null;
  // Backend uses UUID ids for fleets; avoid making API calls with placeholder values like "f1".
  if (!isUuid(trimmed)) return null;
  return trimmed;
}

type FleetContextValue = {
  fleets: Fleet[];
  fleetsLoading: boolean;
  activeFleetId: string | null;
  /** Always prefer active fleet; fallback to configured default fleetId */
  effectiveFleetId: string | null;
  setActiveFleetId: (fleetId: string) => void;
  refreshFleets: () => Promise<void>;
};

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

export function FleetProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [fleetsLoading, setFleetsLoading] = useState(false);
  const [activeFleetId, setActiveFleetIdState] = useState<string | null>(() => {
    return (
      normalizeFleetId(localStorage.getItem(ACTIVE_FLEET_KEY)) ||
      normalizeFleetId(getDefaultFleetId()) ||
      null
    );
  });

  const setActiveFleetId = useCallback((fleetId: string) => {
    setActiveFleetIdState(fleetId);
    localStorage.setItem(ACTIVE_FLEET_KEY, fleetId);
  }, []);

  const refreshFleets = useCallback(async () => {
    if (!isAuthenticated) {
      // Not authenticated (or token not present) — still keep default fleetId if set
      setActiveFleetIdState((prev) => prev || getDefaultFleetId());
      return;
    }
    setFleetsLoading(true);
    try {
      const data = await getFleets();
      setFleets(data || []);

      // Keep a stable active fleet without introducing UI changes
      const stored = normalizeFleetId(localStorage.getItem(ACTIVE_FLEET_KEY));
      const validStored = stored && data?.some((f) => f.id === stored);
      if (validStored) {
        setActiveFleetIdState(stored);
      } else if (data?.[0]?.id) {
        setActiveFleetId(data[0].id);
      } else {
        setActiveFleetIdState(normalizeFleetId(getDefaultFleetId()));
      }
    } catch (err: unknown) {
      // If current role can't access /fleets, avoid breaking the app:
      // fall back to configured default fleetId.
      setActiveFleetIdState((prev) => prev || normalizeFleetId(getDefaultFleetId()));

      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === 'object' && 'message' in data
          ? String((data as Record<string, unknown>).message)
          : null;
      // Only show a toast if no default is configured (otherwise the app works fine).
      if (!getDefaultFleetId() && msg) toast.error(msg);
    } finally {
      setFleetsLoading(false);
    }
  }, [isAuthenticated, setActiveFleetId]);

  useEffect(() => {
    void refreshFleets();
  }, [refreshFleets, isAuthenticated]);

  const value = useMemo<FleetContextValue>(
    () => ({
      fleets,
      fleetsLoading,
      activeFleetId,
      effectiveFleetId: activeFleetId || normalizeFleetId(getDefaultFleetId()),
      setActiveFleetId,
      refreshFleets,
    }),
    [fleets, fleetsLoading, activeFleetId, setActiveFleetId, refreshFleets],
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used within FleetProvider');
  return ctx;
}