

import { useState } from "react";
import { Pencil } from "lucide-react";
import Drawer from "../components/layout/Drawer";
import Table from "../components/ui/Table";
import DriverDrawer from "../components/driver/DriverDrawer";
import AddDriver from "../components/driver/AddDriver";
import Modal from "../components/layout/Modal";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import type { Column } from "../components/ui/Table";

type DriverStatus = "Active" | "Inactive";


interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  rating?: number;
}

const drivers: Driver[] = [
  {
    id: "1",
    name: "Durmesh",
    phone: "+918859946508",
    status: "Active",
    rating: 4.5,
  },
  {
    id: "2",
    name: "Pushpendr",
    phone: "+918954353407",
    status: "Active",
  },
  {
    id: "3",
    name: "Harendra Singh",
    phone: "+919639158317",
    status: "Active",
  },
];

export default function DriverManagement() {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [open, setOpen] = useState(false);

  const columns: Column<Driver>[] = [
    {
      key: "index",
      label: "S.No",
      render: (_, i) => i + 1,
    },
    {
      key: "name",
      label: "Driver Name",
      render: (d) => (
        <span className=" font-medium cursor-pointer">
          {d.name}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone Number",
    },
    {
      key: "status",
      label: "Status",
      render: (d) => (
        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
          {d.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (d) => (
        <button
          onClick={() => setSelectedDriver(d)}
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Driver Management</h1>

        <Button onClick={() => setOpen(true)}>
          + Add Driver
        </Button>

        <Modal open={open} onClose={() => setOpen(false)} title="Add Driver">
          <AddDriver onClose={() => setOpen(false)} />
        </Modal>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by Phone Number"
        />
        <Input
          placeholder="Search by Name"
        />
      </div>

      {/* Table */}
      <Table data={drivers} columns={columns} />

      {/* Drawer */}
      <Drawer
        open={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
        title="Edit Driver"
      >
        <DriverDrawer driver={selectedDriver} />
      </Drawer>
    </div>
  );
}
