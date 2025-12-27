import { Filter } from "lucide-react";
import { useState } from "react";

import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import { useCheckinColumns } from "../components/DriverCheckins/CheckinTableColumns";
import type { DriverCheckin } from "../models/checkin/driverCheckin";

const mockCheckins: DriverCheckin[] = [
  {
    id: "1",
    driverName: "Rohit Kumar",
    driverPhone: "9876543210",
    vehicleNumber: "UP16RT1990",
    fleetName: "Delhi Fleet",
    checkinTime: "2024-12-20 06:30",
    status: "PENDING",
  },
];

export default function DriverCheckins() {
  const columns = useCheckinColumns();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Driver Check-ins</h1>

        <Button
          variant="secondary"
          className="md:hidden"
          onClick={() => setShowFilters((p) => !p)}
        >
          <Filter size={16} />
        </Button>
      </div>

      {/* Filters */}
      <div
        className={`
          ${showFilters ? "block" : "hidden"}
          md:grid grid-cols-1 md:grid-cols-3 gap-4
        `}
      >
        <Input placeholder="Search Driver" />
        <Input placeholder="Vehicle Number" />
        
      </div>

      {/* Table */}
      <Table columns={columns} data={mockCheckins} />
    </div>
  );
}
