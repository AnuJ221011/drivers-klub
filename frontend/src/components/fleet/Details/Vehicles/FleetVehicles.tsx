import { useState } from "react";
import { useParams } from "react-router-dom";
import Table from "../../../ui/Table";
import Button from "../../../ui/Button";
import AddVehiclesModal from "./AddVehicleModal";

const mockVehicles = [
  { number: "UP16RT1990", type: "Sedan" },
  { number: "DL01AB1234", type: "SUV" },
];

export default function FleetVehicles() {
  const { id: fleetId } = useParams();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          + Add Vehicles
        </Button>
      </div>

      <Table
        columns={[
          { key: "number", label: "Vehicle Number" },
          { key: "type", label: "Type" },
        ]}
        data={mockVehicles}
      />

      <AddVehiclesModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
