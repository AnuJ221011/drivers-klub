import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import FleetHeader from "../components/fleet/Details/FleetHeader";
import FleetSummary from "../components/fleet/Details/FleetSummary";
import FleetTabs from "../components/fleet/Details/FleetTabs";

import FleetHubs from "../components/fleet/Details/Hubs/FleetHubs";
import FleetDrivers from "../components/fleet/Details/Drivers/FleetDrivers";
import FleetVehicles from "../components/fleet/Details/Vehicles/FleetVehicles";
import FleetManagers from "../components/fleet/Details/Managers/FleetManagers";
import { getFleetById } from "../api/fleet.api";
import type { Fleet } from "../models/fleet/fleet";
import { useAuth } from "../context/AuthContext";

type Tab = "HUBS" | "DRIVERS" | "VEHICLES" | "MANAGERS";

export default function FleetDetails() {
  const { id } = useParams(); // fleetId from route
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab | null) || "HUBS";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [loading, setLoading] = useState(false);
  const { role, fleetId } = useAuth();

  // Prevent users from navigating to another fleet's page.
  useEffect(() => {
    if (!id) return;
    if (role === "SUPER_ADMIN") return;
    if (fleetId && id !== fleetId) {
      window.location.replace(`/admin/fleets/${fleetId}`);
    }
  }, [id, role, fleetId]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const data = await getFleetById(id);
        if (!mounted) return;
        setFleet(data);
      } catch (err: unknown) {
        const maybeAny = err as { response?: { data?: unknown } };
        const data = maybeAny.response?.data;
        const msg =
          data && typeof data === "object" && "message" in data
            ? String((data as Record<string, unknown>).message)
            : "Failed to load fleet";
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const effectiveFleet = useMemo(() => {
    if (fleet) return fleet;
    // fallback to keep header components stable while loading
    return {
      id: id || "",
      name: "-",
      mobile: "-",
      email: "",
      city: "-",
      fleetType: "INDIVIDUAL",
      panNumber: "-",
      fleetAdminName: "-",
      fleetAdminMobile: "",
      createdAt: "",
      status: "ACTIVE",
    } as Fleet;
  }, [fleet, id]);

  return (
    <div className="space-y-6 max-w-6xl">
      {loading && <div className="text-sm text-black/60">Loading fleet…</div>}
      <FleetHeader fleet={effectiveFleet} />
      <FleetSummary fleet={effectiveFleet} />
      <FleetTabs
        value={tab}
        onChange={setTab}
        tabs={role === "OPERATIONS" ? ["HUBS", "DRIVERS", "VEHICLES"] : ["HUBS", "DRIVERS", "VEHICLES", "MANAGERS"]}
      />

      {tab === "HUBS" && <FleetHubs />}
      {tab === "DRIVERS" && <FleetDrivers />}
      {tab === "VEHICLES" && <FleetVehicles />}
      {tab === "MANAGERS" && role !== "OPERATIONS" ? <FleetManagers /> : null}
    </div>
  );
}