import { useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../ui/Button";
import Table from "../../../ui/Table";
import AddDriversModal from "./AddDriverModal";

const mockDrivers = [
  { id: "d1", name: "Rohit", phone: "9876543210" },
  { id: "d2", name: "Amit", phone: "9123456789" },
];

export default function FleetDrivers() {
  const { id: fleetId } = useParams(); // future use
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          + Add Drivers
        </Button>
      </div>

      <Table
        columns={[
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
        ]}
        data={mockDrivers}
      />

      <AddDriversModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
