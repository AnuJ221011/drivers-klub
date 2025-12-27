import type { CheckinStatus } from "../../models/checkin/driverCheckin";

export default function CheckinStatusBadge({ status }: { status: CheckinStatus }) {
  const map = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}
