import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../ui/Button";

export default function FleetHubDetails() {
  const navigate = useNavigate();
  const { id: fleetId, hubId } = useParams();

  // ✅ Dummy backend response
  const hub = {
    id: hubId,
    name: "Delhi Airport Hub",
    type: "AIRPORT",
    address: "IGI Airport, Terminal 3, New Delhi",
    latitude: 28.5562,
    longitude: 77.1000,
    radius: 800,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{hub.name}</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {/* Hub Info Card */}
      <div className="rounded-lg border border-black/10 bg-white p-4 grid gap-3 text-sm">
        <div><b>Hub Type:</b> {hub.type === "AIRPORT" ? "Airport" : "Office"}</div>
        <div><b>Address:</b> {hub.address}</div>
        <div><b>Latitude:</b> {hub.latitude}</div>
        <div><b>Longitude:</b> {hub.longitude}</div>
        <div><b>Geofence Radius:</b> {hub.radius} meters</div>
      </div>

      {/* Map placeholder (for now) */}
      <div className="rounded-lg border border-dashed border-black/20 bg-yellow-50 p-6 text-sm text-center text-black/60">
        Map preview will be shown here
      </div>
    </div>
  );
}
