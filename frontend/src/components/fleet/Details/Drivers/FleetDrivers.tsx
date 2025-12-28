import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../../../ui/Button";
import Table from "../../../ui/Table";
import AddDriversModal from "./AddDriverModal";
import { getDriversByFleet } from "../../../../api/driver.api";
import type { Driver } from "../../../../models/driver/driver";

export default function FleetDrivers() {
  const { id: fleetId } = useParams();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    try {
      const data = await getDriversByFleet(fleetId);
      setRows(data || []);
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
        <Button onClick={() => setOpen(true)}>
          + Add Drivers
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading drivers…</div>
      ) : (
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
          ]}
          data={rows}
        />
      )}

      {fleetId && (
        <AddDriversModal
          open={open}
          onClose={() => setOpen(false)}
          fleetId={fleetId}
          onAdded={() => void refresh()}
        />
      )}
    </div>
  );
}
