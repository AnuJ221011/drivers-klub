/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { getFleets } from '../api/fleet.api';
import type { Fleet } from '../models/fleet/fleet';
import { useAuth } from './AuthContext';

const ACTIVE_FLEET_KEY = 'dk_active_fleet_id';

type FleetContextValue = {
  fleets: Fleet[];
  fleetsLoading: boolean;
  activeFleetId: string | null;
  /** Active fleet (selected by user) */
  effectiveFleetId: string | null;
  setActiveFleetId: (fleetId: string) => void;
  clearActiveFleetId: () => void;
  refreshFleets: () => Promise<void>;
};

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

export function FleetProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [fleetsLoading, setFleetsLoading] = useState(false);
  const [activeFleetId, setActiveFleetIdState] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_FLEET_KEY);
  });

  const setActiveFleetId = useCallback((fleetId: string) => {
    setActiveFleetIdState(fleetId);
    localStorage.setItem(ACTIVE_FLEET_KEY, fleetId);
  }, []);

  const clearActiveFleetId = useCallback(() => {
    setActiveFleetIdState(null);
    localStorage.removeItem(ACTIVE_FLEET_KEY);
  }, []);

  const refreshFleets = useCallback(async () => {
    if (!isAuthenticated) {
      // Not authenticated (or token not present) — don't force any default
      return;
    }
    setFleetsLoading(true);
    try {
      const data = await getFleets();
      setFleets(data || []);

      // Keep stored fleetId only if it still exists
      const stored = localStorage.getItem(ACTIVE_FLEET_KEY);
      const validStored = stored && data?.some((f) => f.id === stored);
      if (validStored) setActiveFleetIdState(stored);
      else clearActiveFleetId();
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === 'object' && 'message' in data
          ? String((data as Record<string, unknown>).message)
          : null;
      if (msg) toast.error(msg);
    } finally {
      setFleetsLoading(false);
    }
  }, [isAuthenticated, clearActiveFleetId]);

  useEffect(() => {
    void refreshFleets();
  }, [refreshFleets, isAuthenticated]);

  const value = useMemo<FleetContextValue>(
    () => ({
      fleets,
      fleetsLoading,
      activeFleetId,
      effectiveFleetId: activeFleetId,
      setActiveFleetId,
      clearActiveFleetId,
      refreshFleets,
    }),
    [fleets, fleetsLoading, activeFleetId, setActiveFleetId, clearActiveFleetId, refreshFleets],
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used within FleetProvider');
  return ctx;
}