import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../ui/Button";
import HubCard from "./HubCard";

export default function FleetHubs() {
  const navigate = useNavigate();
  const { id: fleetId } = useParams();

  // ✅ Dummy backend-like data
  const hubs = [
    {
      id: "hub-1",
      name: "Delhi Airport Hub",
      type: "AIRPORT",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate(`/admin/fleets/${fleetId}/hubs/create`)}>
          + Add Hub
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hubs.map((hub) => (
          <HubCard
            key={hub.id}
            hub={hub}
            onClick={() =>
              navigate(`/admin/fleets/${fleetId}/hubs/${hub.id}`)
            }
          />
        ))}
      </div>
    </div>
  );
}
