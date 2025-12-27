import { Pencil } from "lucide-react";
import type { Column } from "../ui/Table";
import type { DriverCheckin } from "../../models/checkin/driverCheckin";
import CheckinStatusBadge from "./CheckinStatusBadge";
import { useNavigate } from "react-router-dom";

export function useCheckinColumns(): Column<DriverCheckin>[] {
  const navigate = useNavigate();

  return [
    {
      key: "index",
      label: "S.No",
      render: (_, i) => i + 1,
    },
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
      label: "Action",
      render: (c) => (
        <button
          onClick={() => navigate(`/admin/driver-checkins/${c.id}`)}
          className="p-2 rounded hover:bg-yellow-100"
        >
          <Pencil size={16} />
        </button>
      ),
    },
  ];
}
