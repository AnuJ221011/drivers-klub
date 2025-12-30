import { Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import { useCheckinColumns } from "../components/DriverCheckins/CheckinTableColumns";
import type { DriverCheckin } from "../models/checkin/driverCheckin";
import { getAttendanceHistory } from "../api/attendance.api";

export default function DriverCheckins() {
  const columns = useCheckinColumns();
  const [showFilters, setShowFilters] = useState(false);
  const [rows, setRows] = useState<DriverCheckin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchDriver, setSearchDriver] = useState("");
  const [searchVehicle, setSearchVehicle] = useState("");

  useEffect(() => {
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
        <Table columns={columns} data={filtered} />
      )}
    </div>
  );
}