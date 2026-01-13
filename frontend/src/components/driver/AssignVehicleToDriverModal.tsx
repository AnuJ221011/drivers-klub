import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../layout/Modal";
import Table from "../ui/Table";
import Button from "../ui/Button";
import Input from "../ui/Input";
import type { Driver } from "../../models/driver/driver";
import type { Vehicle } from "../../models/vehicle/vehicle";
import type { AssignmentEntity } from "../../models/assignment/assignment";
import { createAssignment, endAssignment } from "../../api/assignment.api";

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
  const [search, setSearch] = useState("");

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

  const rows = useMemo(() => {
    // Hub restriction: driver can only be assigned to vehicles from the same hub.
    const driverHubId = driver.hubId || null;

    const activeVehicleIds = new Set<string>();
    for (const a of assignments || []) {
      if (a.status !== "ACTIVE") continue;
      activeVehicleIds.add(a.vehicleId);
    }

    const needle = (search || "").trim().toLowerCase();

    return (vehicles || [])
      .filter((v) => {
        if (!driverHubId) return false;
        return (v.hubId || null) === driverHubId;
      })
      .filter((v) => {
        if (!needle) return true;
        return (
          (v.number || "").toLowerCase().includes(needle) ||
          (v.model || "").toLowerCase().includes(needle) ||
          (v.brand || "").toLowerCase().includes(needle)
        );
      })
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
  }, [vehicles, assignments, currentVehicleId, driver.hubId, search]);

  useEffect(() => {
    if (!open) return;
    setSelectedVehicleId(null);
    setSearch("");
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
        {!driver.hubId ? (
          <div className="text-sm text-red-600">
            This driver is not assigned to any hub. Assign a hub first, then assign a vehicle.
          </div>
        ) : null}

        {currentVehicleId && (
          <div className="text-sm text-black/70">
            Note: this driver currently has an active assignment. Assigning a new vehicle will
            end the current assignment first.
          </div>
        )}

        <Input
          placeholder="Search vehicle (number / brand / model)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={!driver.hubId}
        />

        <Table
          columns={[
            {
              key: "select",
              label: "",
              render: (v) => (
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
              key: "status",
              label: "Status",
              render: (v) => (
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
          <Button
            onClick={handleAssign}
            disabled={!driver.hubId || !selectedVehicleId}
            loading={saving}
          >
            Assign Vehicle
          </Button>
        </div>
      </div>
    </Modal>
  );
}
