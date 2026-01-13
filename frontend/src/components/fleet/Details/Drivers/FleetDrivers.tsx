import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Car } from "lucide-react";
import Button from "../../../ui/Button";
import Table from "../../../ui/Table";
import { getDriversByFleet } from "../../../../api/driver.api";
import type { Driver } from "../../../../models/driver/driver";
import { getAssignmentsByFleet } from "../../../../api/assignment.api";
import { getVehiclesByFleet } from "../../../../api/vehicle.api";
import type { AssignmentEntity } from "../../../../models/assignment/assignment";
import type { Vehicle } from "../../../../models/vehicle/vehicle";
import AssignVehicleToDriverModal from "../../../driver/AssignVehicleToDriverModal";
import { useFleet } from "../../../../context/FleetContext";

export default function FleetDrivers() {
  const { id: fleetId } = useParams();
  const navigate = useNavigate();
  const { setActiveFleetId } = useFleet();
  const [rows, setRows] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignedVehicleByDriverId, setAssignedVehicleByDriverId] = useState<Record<string, string>>({});
  const [assignments, setAssignments] = useState<AssignmentEntity[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDriver, setAssignDriver] = useState<Driver | null>(null);

  const refresh = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    try {
      const [drivers, assignments, vehicles] = await Promise.all([
        getDriversByFleet(fleetId),
        getAssignmentsByFleet(fleetId),
        getVehiclesByFleet(fleetId),
      ]);

      setRows(drivers || []);
      setAssignments(assignments || []);
      setVehicles(vehicles || []);

      const vehicleLabelById = new Map<string, string>();
      for (const v of vehicles || []) {
        const label = v.model ? `${v.number} (${v.model})` : v.number;
        vehicleLabelById.set(v.id, label);
      }

      const next: Record<string, string> = {};
      for (const a of assignments || []) {
        if (a.status !== "ACTIVE") continue;
        next[a.driverId] = vehicleLabelById.get(a.vehicleId) || a.vehicleId;
      }
      setAssignedVehicleByDriverId(next);
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === "object" && "message" in data
          ? String((data as Record<string, unknown>).message)
          : "Failed to load drivers";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [fleetId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (!fleetId) return;
            setActiveFleetId(fleetId);
            navigate("/admin/drivers?openAdd=1");
          }}
        >
          + Add Drivers
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading drivers…</div>
      ) : (
        <Table
          columns={[
            { key: "index", label: "S.No", render: (_d, i) => i + 1 },
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
            {
              key: "assignedVehicle",
              label: "Assigned Vehicle",
              render: (d) => assignedVehicleByDriverId[d.id] || "—",
            },
            {
              key: "isActive",
              label: "Active",
              render: (d) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    d.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {d.isActive ? "Active" : "Inactive"}
                </span>
              ),
            },
            {
              key: "isAvailable",
              label: "Available",
              render: (d) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    d.isAvailable ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {d.isAvailable ? "Yes" : "No"}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (d) => (
                <button
                  onClick={() => {
                    setAssignDriver(d);
                    setAssignOpen(true);
                  }}
                  className="p-2 hover:bg-yellow-100 rounded"
                  title="Assign vehicle"
                >
                  <Car size={16} />
                </button>
              ),
            },
          ]}
          data={rows}
        />
      )}

      {fleetId && assignDriver && (
        <AssignVehicleToDriverModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          fleetId={fleetId}
          driver={assignDriver}
          vehicles={vehicles}
          assignments={assignments}
          onAssigned={() => void refresh()}
        />
      )}
    </div>
  );
}