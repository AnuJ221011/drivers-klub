import { Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import { useCheckinColumns, useCheckoutColumns } from "../components/DriverCheckins/CheckinTableColumns";
import type { DriverCheckin } from "../models/checkin/driverCheckin";
import { getAttendanceHistory } from "../api/attendance.api";

export default function DriverCheckins() {
  // Table columns are defined in a separate hook so we can reuse navigation logic
  // and keep this page focused on data-loading + filtering.
  const columns = useCheckinColumns();
  const checkoutColumns = useCheckoutColumns();

  // Two-tab admin view:
  // - "Driver Check-ins" (existing list; keep untouched)
  // - "Check-outs" (derived from the same history feed, filtered by checkOutTime)
  const [activeTab, setActiveTab] = useState<"checkin" | "checkout">("checkin");

  // Small responsive UX: filters collapse on mobile.
  const [showFilters, setShowFilters] = useState(false);

  // The table rows shown on this page.
  const [rows, setRows] = useState<DriverCheckin[]>([]);
  const [loading, setLoading] = useState(false);

  // Simple client-side filters (driver name/phone and vehicle number).
  const [searchDriver, setSearchDriver] = useState("");
  const [searchVehicle, setSearchVehicle] = useState("");

  useEffect(() => {
    // Data loading:
    // - Calls `getAttendanceHistory()` which normally hits the backend.
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const res = await getAttendanceHistory({ page: 1, limit: 50 });
        if (!mounted) return;
        setRows(res.rows || []);
      } catch (err: unknown) {
        const maybeAny = err as { response?: { data?: unknown } };
        const data = maybeAny.response?.data;
        const msg =
          data && typeof data === "object" && "message" in data
            ? String((data as Record<string, unknown>).message)
            : "Failed to load check-ins";
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    // Client-side filtering keeps this demo straightforward.
    return (rows || []).filter((r) => {
      const driverOk =
        !searchDriver ||
        r.driverName.toLowerCase().includes(searchDriver.toLowerCase()) ||
        r.driverPhone.includes(searchDriver);
      const vehicleOk =
        !searchVehicle ||
        r.vehicleNumber.toLowerCase().includes(searchVehicle.toLowerCase());
      return driverOk && vehicleOk;
    });
  }, [rows, searchDriver, searchVehicle]);

  const checkoutOnly = useMemo(() => {
    return filtered.filter((r) => Boolean(r.checkOutTime));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Driver Check-ins</h1>

        <Button
          variant="secondary"
          className="md:hidden"
          onClick={() => setShowFilters((p) => !p)}
        >
          <Filter size={16} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-black/10">
        <button
          type="button"
          onClick={() => setActiveTab("checkin")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition
            ${
              activeTab === "checkin"
                ? "border-yellow-400 text-black"
                : "border-transparent text-black/60 hover:text-black"
            }`}
        >
          Driver Check-ins
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("checkout")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition
            ${
              activeTab === "checkout"
                ? "border-yellow-400 text-black"
                : "border-transparent text-black/60 hover:text-black"
            }`}
        >
          Check-outs
        </button>
      </div>

      {/* Filters */}
      <div
        className={`
          ${showFilters ? "block" : "hidden"}
          md:grid grid-cols-1 md:grid-cols-3 gap-4
        `}
      >
        <Input
          placeholder="Search Driver"
          value={searchDriver}
          onChange={(e) => setSearchDriver(e.target.value)}
        />
        <Input
          placeholder="Vehicle Number"
          value={searchVehicle}
          onChange={(e) => setSearchVehicle(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-black/60">Loading check-ins…</div>
      ) : (
        // Clicking the eye icon in the "Details" column navigates to:
        // `/admin/driver-checkins/:id`
        <Table
          columns={activeTab === "checkin" ? columns : checkoutColumns}
          data={activeTab === "checkin" ? filtered : checkoutOnly}
        />
      )}
    </div>
  );
}