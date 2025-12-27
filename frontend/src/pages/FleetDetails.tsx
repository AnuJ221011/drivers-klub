import { useParams } from "react-router-dom";
import { useState } from "react";

import FleetHeader from "../components/fleet/Details/FleetHeader";
import FleetSummary from "../components/fleet/Details/FleetSummary";
import FleetTabs from "../components/fleet/Details/FleetTabs";

import FleetHubs from "../components/fleet/Details/Hubs/FleetHubs";
import FleetDrivers from "../components/fleet/Details/Drivers/FleetDrivers";
import FleetVehicles from "../components/fleet/Details/Vehicles/FleetVehicles";
import FleetManagers from "../components/fleet/Details/Managers/FleetManagers";

type Tab = "HUBS" | "DRIVERS" | "VEHICLES" | "MANAGERS";

export default function FleetDetails() {
  const { id } = useParams(); // fleetId from route
  const [tab, setTab] = useState<Tab>("HUBS");

  // dummy backend data
  const fleet = {
    id: id || "1",
    name: "Rohit Sharma",
    mobile: "9876543210",
    email: "rohit@gmail.com",
    city: "Delhi",
    fleetType: "INDIVIDUAL",
    panNumber: "ABCDE1234F",
    modeId: "MODE123",
    createdAt: "2024-12-10",
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <FleetHeader fleet={fleet} />
      <FleetSummary fleet={fleet} />
      <FleetTabs value={tab} onChange={setTab} />

      {tab === "HUBS" && <FleetHubs />}
      {tab === "DRIVERS" && <FleetDrivers />}
      {tab === "VEHICLES" && <FleetVehicles />}
      {tab === "MANAGERS" && <FleetManagers />}
    </div>
  );
}
