import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../../../ui/Button";
import Table from "../../../ui/Table";
import AddManagersModal from "./AddManagersModal";
import { getFleetManagersByFleet } from "../../../../api/fleetManager.api";
import type { FleetManagerEntity } from "../../../../api/fleetManager.api";

export default function FleetManagers() {
  const { id: fleetId } = useParams();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<FleetManagerEntity[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    try {
      const data = await getFleetManagersByFleet(fleetId);
      setRows(data || []);
      console.log("Fleet Managers Rows:", rows);
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === "object" && "message" in data
          ? String((data as Record<string, unknown>).message)
          : "Failed to load managers";
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
      {/* <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          + Add Managers
        </Button>
      </div> */}

      {loading ? (
        <div className="text-sm text-black/60">Loading managers…</div>
      ) : (
        <Table
          columns={[
            { key: "index", label: "S.No", render: (_m, i) => i + 1 },
            { key: "shortId", label: "Manager ID", render: (m) => m.shortId || m.id },
            { key: "name", label: "Name" },
            {
              key: "role",
              label: "Role",
              render: (m) => {
                const r = (m.role || "").toUpperCase();
                if (r === "FLEET_ADMIN") return "Fleet Admin";
                if (r === "MANAGER") return "Manager";
                return m.role || "-";
              },
            },
            { key: "mobile", label: "Phone" },
            { key: "city", label: "City" },
            { key: "status", label: "Status" },
          ]}
          data={rows}
        />
      )}

      {fleetId && (
        <AddManagersModal
          open={open}
          onClose={() => setOpen(false)}
          fleetId={fleetId}
          onAdded={() => void refresh()}
        />
      )}
    </div>
  );
}