import { useState } from "react";
import { Pencil } from "lucide-react";

import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import Drawer from "../components/layout/Drawer";
import Modal from "../components/layout/Modal";

import VehicleDrawer from "../components/Vehicle/VehicleDrawer";
import AddVehicle from "../components/Vehicle/AddVehicle";

import type { Column } from "../components/ui/Table";

type Vehicle = {
  id: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  bodyType: string;
  fuelType: string;
  status: "Active" | "Inactive";
};

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    vehicleNumber: "UP16QT6201",
    brand: "Maruti",
    model: "Dzire",
    bodyType: "Sedan",
    fuelType: "Petrol",
    status: "Active",
  },
];

export default function VehicleManagement() {
  const [open, setOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [searchVehicleNo, setSearchVehicleNo] = useState("");
  const [searchBrand, setSearchBrand] = useState("");

  const columns: Column<Vehicle>[] = [
    {
      key: "index",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    { key: "vehicleNumber", label: "Vehicle Number" },
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "bodyType", label: "Body Type" },
    { key: "fuelType", label: "Fuel Type" },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
          {v.status}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (v) => (
        <button
          onClick={() => setSelectedVehicle(v)}
          className="p-2 hover:bg-yellow-100 rounded"
        >
          <Pencil size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          Vehicle Management
        </h1>

        <Button onClick={() => setOpen(true)}>
          + Add Vehicle
        </Button>
      </div>

      {/* Filters */}
            <div className="flex gap-4">
              <Input
                placeholder="Search by Vehicle No."
              />
              <Input
                placeholder="Search by brand"
              />
            </div>

      {/* Add Vehicle Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Vehicle"
      >
        <AddVehicle onClose={() => setOpen(false)} />
      </Modal>

      {/* Table */}
      <Table columns={columns} data={mockVehicles} />

      {/* Edit Drawer */}
      <Drawer
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title="Edit Vehicle"
      >
        <VehicleDrawer vehicle={selectedVehicle} />
      </Drawer>
    </div>
  );
}
