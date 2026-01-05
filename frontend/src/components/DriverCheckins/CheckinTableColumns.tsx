import { Eye } from "lucide-react";
import type { Column } from "../ui/Table";
import type { DriverCheckin } from "../../models/checkin/driverCheckin";
import CheckinStatusBadge from "./CheckinStatusBadge";
import { useNavigate } from "react-router-dom";

function formatMaybeDate(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

export function useCheckinColumns(): Column<DriverCheckin>[] {
  const navigate = useNavigate();

  return [
    {
      key: "index",
      label: "S.No",
      render: (_, i) => i + 1,
    },
    // These keys map directly to properties on the `DriverCheckin` model.
    { key: "driverName", label: "Driver" },
    { key: "driverPhone", label: "Phone" },
    { key: "vehicleNumber", label: "Vehicle" },
    { key: "fleetName", label: "Fleet" },
    {
      key: "status",
      label: "Status",
      render: (c) => <CheckinStatusBadge status={c.status} />,
    },
    {
      key: "actions",
      label: "Details",
      render: (c) => (
        <button
          // The list page doesn't render a drawer; it navigates to a dedicated detail route.
          onClick={() => navigate(`/admin/driver-checkins/${c.id}`)}
          className="p-2 rounded hover:bg-yellow-100"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];
}

export function useCheckoutColumns(): Column<DriverCheckin>[] {
  const navigate = useNavigate();

  return [
    { key: "index", label: "S.No", render: (_, i) => i + 1 },
    { key: "driverName", label: "Driver" },
    { key: "driverPhone", label: "Phone" },
    { key: "vehicleNumber", label: "Vehicle" },
    { key: "fleetName", label: "Fleet" },
    { key: "checkOutTime", label: "Check-out", render: (c) => formatMaybeDate(c.checkOutTime) },
    { key: "status", label: "Status", render: (c) => <CheckinStatusBadge status={c.status} /> },
    {
      key: "actions",
      label: "Details",
      render: (c) => (
        <button
          // Admin checkout view: show the *driver's* attendance history list,
          // not the single attendance record detail page.
          onClick={() => {
            const driverId = c.driverId;
            if (!driverId) return;
            navigate(`/admin/driver-checkouts/${driverId}`);
          }}
          className="p-2 rounded hover:bg-yellow-100"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];
}
