import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import { getAttendanceHistory } from "../api/attendance.api";
import type { DriverCheckin } from "../models/checkin/driverCheckin";

function formatMaybeDate(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

/**
 * Admin view:
 * Show attendance history list for a single driver (check-in/out + odometer fields).
 *
 * Backend equivalent (driver-side) is: GET /attendance/history?driverId={uuid}
 */
export default function DriverCheckoutHistory() {
  const { driverId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DriverCheckin[]>([]);

  useEffect(() => {
    if (!driverId) return;
    let mounted = true;

    void (async () => {
      setLoading(true);
      try {
        const res = await getAttendanceHistory({ driverId, page: 1, limit: 200 });
        if (!mounted) return;
        setRows(res.rows || []);
      } catch (err: unknown) {
        const maybeAny = err as { response?: { data?: unknown } };
        const data = maybeAny.response?.data;
        const msg =
          data && typeof data === "object" && "message" in data
            ? String((data as Record<string, unknown>).message)
            : "Failed to load attendance history";
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [driverId]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const at = new Date(a.checkinTime).getTime();
      const bt = new Date(b.checkinTime).getTime();
      return bt - at;
    });
  }, [rows]);

  const columns = useMemo(() => {
    return [
      { key: "index", label: "S.No", render: (_: DriverCheckin, i: number) => i + 1 },
      { key: "checkinTime", label: "Check-in Time", render: (r: DriverCheckin) => formatMaybeDate(r.checkinTime) },
      { key: "checkOutTime", label: "Check-out Time", render: (r: DriverCheckin) => formatMaybeDate(r.checkOutTime) },
      { key: "status", label: "Status" },
      { key: "odometerStart", label: "Odometer Start", render: (r: DriverCheckin) => (typeof r.odometerStart === "number" ? r.odometerStart : "-") },
      { key: "odometerEnd", label: "Odometer End", render: (r: DriverCheckin) => (typeof r.odometerEnd === "number" ? r.odometerEnd : "-") },
      { key: "totalKm", label: "Total Km", render: (r: DriverCheckin) => (typeof r.totalKm === "number" ? r.totalKm : "-") },
    ];
  }, []);

  const headerName = sorted[0]?.driverName;
  const headerPhone = sorted[0]?.driverPhone;
  const headerDriverId = sorted[0]?.driverShortId || driverId || "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Attendance History</h1>
          <div className="text-sm text-black/60">
            Driver: <span className="text-black">{headerName && headerName !== "-" ? headerName : headerDriverId}</span>
            {headerPhone ? ` • ${headerPhone}` : ""}
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading attendance history…</div>
      ) : (
        <Table columns={columns} data={sorted} />
      )}
    </div>
  );
}

