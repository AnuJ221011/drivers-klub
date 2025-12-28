import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Table from "../../../ui/Table";
import Button from "../../../ui/Button";
import AddVehiclesModal from "./AddVehicleModal";
import { getVehiclesByFleet } from "../../../../api/vehicle.api";
import type { Vehicle } from "../../../../models/vehicle/vehicle";

export default function FleetVehicles() {
  const { id: fleetId } = useParams();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    try {
      const data = await getVehiclesByFleet(fleetId);
      setRows(data || []);
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === "object" && "message" in data
          ? String((data as Record<string, unknown>).message)
          : "Failed to load vehicles";
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
        <Button onClick={() => setOpen(true)}>
          + Add Vehicles
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading vehicles…</div>
      ) : (
        <Table
          columns={[
            { key: "number", label: "Vehicle Number" },
            { key: "bodyType", label: "Type" },
          ]}
          data={rows}
        />
      )}

      {fleetId && (
        <AddVehiclesModal
          open={open}
          onClose={() => setOpen(false)}
          fleetId={fleetId}
          onAdded={() => void refresh()}
        />
      )}
    </div>
  );
}
