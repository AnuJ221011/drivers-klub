import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../../ui/Button";
import HubCard from "./HubCard";
import { getFleetHubs } from "../../../../api/fleetHub.api";

export default function FleetHubs() {
  const navigate = useNavigate();
  const { id: fleetId } = useParams();

  const [hubs, setHubs] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fleetId) return;
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const data = await getFleetHubs(fleetId);
        if (!mounted) return;
        setHubs(
          (data || []).map((h) => ({
            id: h.id,
            name: h.address,
            type: h.hubType,
          })),
        );
      } catch (err: unknown) {
        const maybeAny = err as { response?: { data?: unknown } };
        const data = maybeAny.response?.data;
        const msg =
          data && typeof data === "object" && "message" in data
            ? String((data as Record<string, unknown>).message)
            : "Failed to load hubs";
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fleetId]);

  const cards = useMemo(() => hubs || [], [hubs]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate(`/admin/fleets/${fleetId}/hubs/create`)}>
          + Add Hub
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading hubs…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((hub) => (
            <HubCard
              key={hub.id}
              hub={hub}
              onClick={() =>
                navigate(`/admin/fleets/${fleetId}/hubs/${hub.id}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}