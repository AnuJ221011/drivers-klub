import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../layout/Modal";
import Table from "../ui/Table";
import Button from "../ui/Button";
import type { Driver } from "../../models/driver/driver";
import type { Vehicle } from "../../models/vehicle/vehicle";
import type { AssignmentEntity } from "../../models/assignment/assignment";
import { createAssignment, endAssignment } from "../../api/assignment.api";

type VehicleRow = Vehicle & { _disabled: boolean; _status: string };

type Props = {
  open: boolean;
  onClose: () => void;
  fleetId: string;
  driver: Driver;
  vehicles: Vehicle[];
  assignments: AssignmentEntity[];
  onAssigned: () => void;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const maybeAny = err as { response?: { data?: unknown } };
    const data = maybeAny.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      return String((data as Record<string, unknown>).message);
    }
  }
  return fallback;
}

export default function AssignVehicleToDriverModal({
  open,
  onClose,
  fleetId,
  driver,
  vehicles,
  assignments,
  onAssigned,
}: Props) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { currentAssignmentId, currentVehicleId } = useMemo(() => {
    const activeByDriverId = new Map<string, AssignmentEntity>();
    for (const a of assignments || []) {
      if (a.status !== "ACTIVE") continue;
      activeByDriverId.set(a.driverId, a);
    }
    const current = activeByDriverId.get(driver.id);
    return {
      currentAssignmentId: current?.id ?? null,
      currentVehicleId: current?.vehicleId ?? null,
    };
  }, [assignments, driver.id]);

  const rows: VehicleRow[] = useMemo(() => {
    const activeVehicleIds = new Set<string>();
    for (const a of assignments || []) {
      if (a.status !== "ACTIVE") continue;
      activeVehicleIds.add(a.vehicleId);
    }

    return (vehicles || [])
      .map((v) => {
        const inUseByOtherDriver =
          activeVehicleIds.has(v.id) && v.id !== currentVehicleId;
        return {
          ...v,
          _disabled: !v.isActive || inUseByOtherDriver,
          _status: !v.isActive ? "Inactive" : inUseByOtherDriver ? "In use" : "Available",
        };
      })
      .sort((a, b) => {
        // Available first, then in-use, then inactive
        const rank = (r: { _status: string }) =>
          r._status === "Available" ? 0 : r._status === "In use" ? 1 : 2;
        return rank(a) - rank(b);
      });
  }, [vehicles, assignments, currentVehicleId]);

  useEffect(() => {
    if (!open) return;
    setSelectedVehicleId(null);
  }, [open]);

  const handleAssign = async () => {
    if (!selectedVehicleId) return;

    if (currentVehicleId && selectedVehicleId === currentVehicleId) {
      toast("This driver is already assigned to this vehicle.");
      return;
    }

    try {
      setSaving(true);

      // Backend allows only 1 active assignment per driver and per vehicle.
      // If driver already has one, end it first.
      if (currentAssignmentId) {
        await endAssignment(currentAssignmentId);
      }

      await createAssignment({
        fleetId,
        driverId: driver.id,
        vehicleId: selectedVehicleId,
      });

      toast.success("Vehicle assigned");
      onClose();
      onAssigned();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to assign vehicle"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign Vehicle • ${driver.name}`}>
      <div className="space-y-4">
        {currentVehicleId && (
          <div className="text-sm text-black/70">
            Note: this driver currently has an active assignment. Assigning a new vehicle will
            end the current assignment first.
          </div>
        )}

        <Table
          columns={[
            {
              key: "select",
              label: "",
              render: (v: VehicleRow, _i: number) => (
                <input
                  type="radio"
                  checked={selectedVehicleId === v.id}
                  disabled={v._disabled}
                  onChange={() => setSelectedVehicleId(v.id)}
                />
              ),
            },
            { key: "number", label: "Vehicle Number" },
            { key: "model", label: "Model" },
            {
              key: "_status",
              label: "Status",
              render: (v: VehicleRow, _i: number) => (
                <span className="text-xs text-black/70">{v._status}</span>
              ),
            },
          ]}
          data={rows}
        />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedVehicleId} loading={saving}>
            Assign Vehicle
          </Button>
        </div>
      </div>
    </Modal>
  );
}

