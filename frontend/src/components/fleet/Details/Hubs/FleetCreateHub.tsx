import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";

import Input from "../../../ui/Input";
import Select from "../../../ui/Select";
import Button from "../../../ui/Button";
import { createFleetHub } from "../../../../api/fleetHub.api";

type LatLng = { lat: number; lng: number };

function PlaceSearch({
  value,
  onChange,
  onPlaceSelected,
}: {
  value: string;
  onChange: (v: string) => void;
  onPlaceSelected: (p: { lat: number; lng: number; address?: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    if (!window.google?.maps?.places) return;
    if (acRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["geometry", "formatted_address", "name"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;
      const lat = typeof loc.lat === "function" ? loc.lat() : (loc as any).lat;
      const lng = typeof loc.lng === "function" ? loc.lng() : (loc as any).lng;
      if (typeof lat !== "number" || typeof lng !== "number") return;
      onPlaceSelected({
        lat,
        lng,
        address: place.formatted_address || place.name || undefined,
      });
    });

    acRef.current = ac;
  }, [onPlaceSelected]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search location…"
      className="w-full rounded-md border border-black/20 bg-white px-3 py-2 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-sm"
    />
  );
}

/* ---------------- Geofence Circle ---------------- */
function GeofenceCircle({
  center,
  radius,
}: {
  center: google.maps.LatLngLiteral;
  radius: number;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    circleRef.current = new google.maps.Circle({
      map,
      center,
      radius,
      strokeColor: "#facc15",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#fde68a",
      fillOpacity: 0.3,
    });

    return () => {
      circleRef.current?.setMap(null);
    };
  }, [map, center, radius]);

  return null;
}

function GoogleRecenter({ center }: { center: google.maps.LatLngLiteral }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.setCenter(center);
  }, [map, center.lat, center.lng]);
  return null;
}

/* ---------------- Main Component ---------------- */
export default function FleetCreateHub() {
  // Route uses `/admin/fleets/:id/...` across the app
  const { id: fleetId } = useParams();
  const navigate = useNavigate();

  const [hubName, setHubName] = useState("");
  const [hubType, setHubType] = useState("");
  const [radius, setRadius] = useState(500);
  const [saving, setSaving] = useState(false);

  const [location, setLocation] = useState<LatLng>({
    lat: 28.6139,
    lng: 77.209,
  });

  const [address, setAddress] = useState("");
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const hasGoogleKey = Boolean((apiKey || "").trim());

  const googleEmbedSrc = useMemo(() => {
    const q = `${location.lat},${location.lng}`;
    const z = 13;
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${z}&output=embed`;
  }, [location.lat, location.lng]);

  /* ---------- Reverse Geocoding ---------- */
  const fetchAddress = async (lat: number, lng: number) => {
    if (!window.google?.maps) return;
    const geocoder = new google.maps.Geocoder();
    const res = await geocoder.geocode({ location: { lat, lng } });
    if (res.results[0]) {
      setAddress(res.results[0].formatted_address);
    }
  };

  const handleMapClick = async (e: any) => {
    if (!e.detail?.latLng) return;

    const ll = e.detail.latLng;
    const lat = typeof ll.lat === "function" ? ll.lat() : ll.lat;
    const lng = typeof ll.lng === "function" ? ll.lng() : ll.lng;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    setLocation({ lat, lng });
    await fetchAddress(lat, lng);
  };

  /* ---------- Save Hub ---------- */
  const handleSave = async () => {
    if (!fleetId) {
      toast.error("Missing fleetId in URL. Please open this page from a fleet.");
      return;
    }

    const input = {
      // Backend expects: address (string), hubType (string), location {lat,lng}
      address: (address || hubName).trim(),
      hubType: hubType.trim(),
      location: { lat: location.lat, lng: location.lng },
    };

    console.log("HUB PAYLOAD:", { fleetId, ...input, radius, name: hubName });

    try {
      setSaving(true);
      await createFleetHub(fleetId, input);
      toast.success("Hub created");
      navigate(`/admin/fleets/${fleetId}?tab=HUBS`);
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === "object" && "message" in data
          ? String((data as Record<string, unknown>).message)
          : "Failed to create hub";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Create Hub</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------- Map ---------- */}
        <div className="lg:col-span-2 h-[520px] rounded-lg overflow-hidden border">
          {hasGoogleKey ? (
            <APIProvider apiKey={apiKey!} libraries={["places"]}>
              <div className="relative h-full w-full">
                <div className="absolute top-3 left-3 right-3 z-10 max-w-xl">
                  <PlaceSearch
                    value={address}
                    onChange={setAddress}
                    onPlaceSelected={async ({ lat, lng, address }) => {
                      setLocation({ lat, lng });
                      if (address) setAddress(address);
                      else await fetchAddress(lat, lng);
                    }}
                  />
                </div>
                <Map
                  defaultZoom={13}
                  defaultCenter={location as google.maps.LatLngLiteral}
                  onClick={handleMapClick}
                >
                  <GoogleRecenter center={location as google.maps.LatLngLiteral} />
                  <AdvancedMarker position={location as google.maps.LatLngLiteral}>
                    <Pin background="#facc15" />
                  </AdvancedMarker>

                  <GeofenceCircle center={location as google.maps.LatLngLiteral} radius={radius} />
                </Map>
              </div>
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
              <div className="p-2 text-xs text-black/60 border-t bg-white">
                Google map is shown in embed mode (no API key). To enable map clicks + geofence drawing,
                configure <code>VITE_GOOGLE_MAPS_API_KEY</code>.
              </div>
            </div>
          )}
        </div>

        {/* ---------- Form ---------- */}
        <div className="space-y-4 bg-white border rounded-lg p-4">
          <Input
            label="Hub Name"
            placeholder="Delhi Airport Hub"
            value={hubName}
            onChange={(e) => setHubName(e.target.value)}
          />

          <Select
            label="Hub Type"
            value={hubType}
            onChange={(e) => setHubType(e.target.value)}
            options={[
              { label: "Select Type", value: "" },
              { label: "Airport", value: "AIRPORT" },
              { label: "Office", value: "OFFICE" },
              { label: "Yard", value: "YARD" },
            ]}
          />

          <div>
            <label className="text-sm font-medium">
              Geofence Radius ({radius} m)
            </label>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              value={String(location.lat)}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                setLocation((prev) => ({ ...prev, lat: v }));
              }}
            />
            <Input
              label="Longitude"
              value={String(location.lng)}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                setLocation((prev) => ({ ...prev, lng: v }));
              }}
            />
          </div>

          <Input
            label="Address"
            placeholder={hasGoogleKey ? "Auto-filled from map click (optional)" : "Enter address (optional)"}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!hubName || !hubType || saving}
          >
            {saving ? "Saving…" : "Save Hub"}
          </Button>
        </div>
      </div>
    </div>
  );
}