import { useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../ui/Button";
import Table from "../../../ui/Table";
import AddManagersModal from "./AddManagersModal";

export default function FleetManagers() {
  const { id: fleetId } = useParams();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          + Add Managers
        </Button>
      </div>

      <Table
        columns={[
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
        ]}
        data={[
          {
            name: "Amit Sharma",
            phone: "9876543211",
            email: "amit@fleet.com",
          },
        ]}
      />

      <AddManagersModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
