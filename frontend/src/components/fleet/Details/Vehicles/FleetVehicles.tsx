import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Table from "../../../ui/Table";
import Button from "../../../ui/Button";
import { getVehiclesByFleet } from "../../../../api/vehicle.api";
import type { Vehicle } from "../../../../models/vehicle/vehicle";
import { useFleet } from "../../../../context/FleetContext";
import { getFleetHubs } from "../../../../api/fleetHub.api";
import type { FleetHubEntity } from "../../../../api/fleetHub.api";
import { useMemo } from "react";



export default function FleetVehicles() {
  const { id: fleetId } = useParams();
  const navigate = useNavigate();
  const { setActiveFleetId } = useFleet();
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [hubs, setHubs] = useState<FleetHubEntity[]>([]);


  const refresh = useCallback(async () => {
  if (!fleetId) return;
  setLoading(true);
  try {
    const [vehicles, hubs] = await Promise.all([
      getVehiclesByFleet(fleetId),
      getFleetHubs(fleetId),
    ]);

    setRows(vehicles || []);
    setHubs(hubs || []);
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

const hubLabelById = useMemo(() => {
  const map = new Map<string, string>();

  for (const h of hubs) {
    const type = h.hubType || "Hub";
    const addr = h.address || "";
    map.set(h.id, addr ? `${type} • ${addr}` : type);
  }

  return map;
}, [hubs]);


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
            navigate("/admin/vehicles?openAdd=1");
          }}
        >
          + Add Vehicles
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading vehicles…</div>
      ) : (
        <Table
          columns={[
            { key: "index", label: "S.No", render: (_v, i) => i + 1 },
            {
              key: "shortId",
              label: "Vehicle ID",
              render: (v) => v.shortId || v.id,
            },
            { key: "number", label: "Vehicle Number" },
            { key: "brand", label: "Brand" },
            { key: "model", label: "Model" },
            { key: "fuelType", label: "Fuel Type" },
            {
              key: "hub",
              label: "Hub",
              render: (v) => {
                if (!v.hubId) return "—";
                return hubLabelById.get(v.hubId) || v.hubId;
              },
            },
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

    </div>
  );
}