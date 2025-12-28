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
            { key: "brand", label: "Brand" },
            { key: "model", label: "Model" },
            { key: "fuelType", label: "Fuel Type" },
            {
              key: "isActive",
              label: "Status",
              render: (v) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    v.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {v.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              ),
            },
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
