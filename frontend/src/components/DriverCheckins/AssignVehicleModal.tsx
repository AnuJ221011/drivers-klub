import { useState } from "react";
import Modal from "../layout/Modal";
import Button from "../ui/Button";
import Table from "../ui/Table";

type Vehicle = {
  id: string;
  number: string;
  model: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAssign: (vehicle: Vehicle) => void;
};

const mockVehicles: Vehicle[] = [
  { id: "v1", number: "UP16RT1990", model: "Swift Dzire" },
  { id: "v2", number: "DL01AB2345", model: "Innova Crysta" },
  { id: "v3", number: "HR26DK8337", model: "Ertiga" },
];

export default function AssignVehicleModal({
  open,
  onClose,
  onAssign,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Modal open={open} onClose={onClose} title="Assign Vehicle">
      <div className="space-y-4">
        <Table
          columns={[
            {
              key: "select",
              label: "",
              render: (v: Vehicle) => (
                <input
                  type="radio"
                  checked={selectedId === v.id}
                  onChange={() => setSelectedId(v.id)}
                />
              ),
            },
            { key: "number", label: "Vehicle Number" },
            { key: "model", label: "Model" },
          ]}
          data={mockVehicles}
        />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedId}
            onClick={() => {
              const vehicle = mockVehicles.find(v => v.id === selectedId);
              if (vehicle) {
                onAssign(vehicle);
                onClose();
              }
            }}
          >
            Assign Vehicle
          </Button>
        </div>
      </div>
    </Modal>
  );
}