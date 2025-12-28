import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../../ui/Button";
import { getFleetHubById, parseHubLocation } from "../../../../api/fleetHub.api";

export default function FleetHubDetails() {
  const navigate = useNavigate();
  const { id: fleetId, hubId } = useParams();

  const [loading, setLoading] = useState(false);
  const [hub, setHub] = useState<{
    id: string;
    hubType: string;
    address: string;
    location: { lat: number; lng: number } | null;
  } | null>(null);

  useEffect(() => {
    if (!hubId) return;
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const data = await getFleetHubById(hubId);
        if (!mounted) return;
        setHub({
          id: data.id,
          hubType: data.hubType,
          address: data.address,
          location: parseHubLocation(data.location),
        });
      } catch (err: unknown) {
        const maybeAny = err as { response?: { data?: unknown } };
        const data = maybeAny.response?.data;
        const msg =
          data && typeof data === "object" && "message" in data
            ? String((data as Record<string, unknown>).message)
            : "Failed to load hub";
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [hubId]);

  const typeLabel = useMemo(() => {
    const t = hub?.hubType;
    if (!t) return "-";
    if (t === "AIRPORT") return "Airport";
    if (t === "OFFICE") return "Office";
    if (t === "YARD") return "Yard";
    return t;
  }, [hub?.hubType]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hub Details</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {loading && <div className="text-sm text-black/60">Loading…</div>}

      {/* Hub Info Card */}
      <div className="rounded-lg border border-black/10 bg-white p-4 grid gap-3 text-sm">
        <div><b>Hub Type:</b> {typeLabel}</div>
        <div><b>Address:</b> {hub?.address || "—"}</div>
        <div><b>Latitude:</b> {hub?.location?.lat ?? "—"}</div>
        <div><b>Longitude:</b> {hub?.location?.lng ?? "—"}</div>
      </div>

      {/* Map placeholder (for now) */}
      <div className="rounded-lg border border-dashed border-black/20 bg-yellow-50 p-6 text-sm text-center text-black/60">
        Map preview will be shown here
      </div>
    </div>
  );
}
