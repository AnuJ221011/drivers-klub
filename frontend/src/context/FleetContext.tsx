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
  setActiveFleetId: (fleetId: string) => void;
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

  const refreshFleets = useCallback(async () => {
    if (!isAuthenticated) return;
    setFleetsLoading(true);
    try {
      const data = await getFleets();
      setFleets(data || []);

      // Keep a stable active fleet without introducing UI changes
      const stored = localStorage.getItem(ACTIVE_FLEET_KEY);
      const validStored = stored && data?.some((f) => f.id === stored);
      if (validStored) {
        setActiveFleetIdState(stored);
      } else if (data?.[0]?.id) {
        setActiveFleetId(data[0].id);
      } else {
        setActiveFleetIdState(null);
      }
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === 'object' && 'message' in data
          ? String((data as Record<string, unknown>).message)
          : 'Failed to load fleets';
      toast.error(msg);
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

