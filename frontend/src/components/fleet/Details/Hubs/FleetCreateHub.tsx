import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

/* ---------------- Main Component ---------------- */
export default function FleetCreateHub() {
  const { fleetId } = useParams();
  const navigate = useNavigate();

  const [hubName, setHubName] = useState("");
  const [hubType, setHubType] = useState("");
  const [radius, setRadius] = useState(500);

  const [location, setLocation] = useState<google.maps.LatLngLiteral>({
    lat: 28.6139,
    lng: 77.209,
  });

  const [address, setAddress] = useState("");

  /* ---------- Reverse Geocoding ---------- */
  const fetchAddress = async (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    const res = await geocoder.geocode({ location: { lat, lng } });
    if (res.results[0]) {
      setAddress(res.results[0].formatted_address);
    }
  };

  const handleMapClick = async (e: any) => {
    if (!e.detail?.latLng) return;

    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;

    setLocation({ lat, lng });
    await fetchAddress(lat, lng);
  };

  /* ---------- Save Hub ---------- */
  const handleSave = () => {
    const payload = {
      fleetId,
      name: hubName,
      type: hubType,
      location,
      address,
      radius,
    };

    console.log("HUB PAYLOAD:", payload);

    // TODO: API call later

    navigate(`/admin/fleets/${fleetId}?tab=HUBS`);
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="p-6 text-red-600">
        Google Maps API key missing
      </div>
    );
  }

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
          <APIProvider apiKey={apiKey}>
            <Map
              defaultZoom={13}
              defaultCenter={location}
              onClick={handleMapClick}
            >
              <AdvancedMarker position={location}>
                <Pin background="#facc15" />
              </AdvancedMarker>

              <GeofenceCircle center={location} radius={radius} />
            </Map>
          </APIProvider>
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

          <div className="text-sm bg-yellow-50 p-3 rounded">
            <div><b>Latitude:</b> {location.lat.toFixed(6)}</div>
            <div><b>Longitude:</b> {location.lng.toFixed(6)}</div>
            <div className="mt-1">
              <b>Address:</b> {address || "—"}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!hubName || !hubType}
          >
            Save Hub
          </Button>
        </div>
      </div>
    </div>
  );
}
