import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../../ui/Button";
import { getFleetHubById, parseHubLocation } from "../../../../api/fleetHub.api";
import { APIProvider, AdvancedMarker, Map, Pin, useMap } from "@vis.gl/react-google-maps";

function GoogleRecenter({ center }: { center: google.maps.LatLngLiteral }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.setCenter(center);
  }, [map, center.lat, center.lng]);
  return null;
}

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

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const hasGoogleKey = Boolean((apiKey || "").trim());
  const [mapAuthFailed, setMapAuthFailed] = useState(false);
  const [mapLoadTimeout, setMapLoadTimeout] = useState(false);

  useEffect(() => {
    setMapAuthFailed(false);
    setMapLoadTimeout(false);
    if (!hasGoogleKey) return;

    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      setMapAuthFailed(true);
    };

    const timeoutId = window.setTimeout(() => {
      if (!window.google?.maps) {
        setMapLoadTimeout(true);
      }
    }, 7000);

    return () => {
      window.gm_authFailure = previous;
      window.clearTimeout(timeoutId);
    };
  }, [hasGoogleKey]);

  const location = hub?.location || { lat: 28.6139, lng: 77.209 };
  const googleEmbedSrc = useMemo(() => {
    const q = `${location.lat},${location.lng}`;
    const z = 13;
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${z}&output=embed`;
  }, [location.lat, location.lng]);
  const showInteractiveMap = hasGoogleKey && !mapAuthFailed && !mapLoadTimeout;
  const mapFallbackMessage = !hasGoogleKey
    ? "Google map is shown in embed mode (no API key). Configure VITE_GOOGLE_MAPS_API_KEY to enable the interactive map."
    : mapAuthFailed
      ? "Google Maps authentication failed. Check API key, billing, and HTTP referrer restrictions."
      : mapLoadTimeout
        ? "Google Maps failed to load. Check network access or API key settings."
        : "";

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

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-black/10 h-[420px] bg-white">
        {showInteractiveMap ? (
          <APIProvider apiKey={apiKey!} libraries={["marker"]}>
            <Map
              defaultZoom={13}
              defaultCenter={location as google.maps.LatLngLiteral}
            >
              <GoogleRecenter center={location as google.maps.LatLngLiteral} />
              <AdvancedMarker position={location as google.maps.LatLngLiteral}>
                <Pin background="#facc15" />
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          <div className="h-full w-full">
            <iframe
              title="Google Map"
              src={googleEmbedSrc}
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {mapFallbackMessage ? (
              <div className="p-2 text-xs text-black/60 border-t bg-white">{mapFallbackMessage}</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}