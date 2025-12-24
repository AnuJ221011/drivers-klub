import { useEffect, useMemo, useState } from "react";
import { Pencil, Filter } from "lucide-react";
import toast from "react-hot-toast";

import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

import Modal from "../components/layout/Modal";
import Drawer from "../components/layout/Drawer";

import CreateNewFleet from "../components/fleet/CreateNewFleet";
import FleetDrawer from "../components/fleet/FleetDrawer";

import type { Column } from "../components/ui/Table";
import { useFleet } from "../context/FleetContext";
import type { Fleet, FleetType } from "../models/fleet/fleet";

export default function FleetManagement() {
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchMobile, setSearchMobile] = useState("");
  const [fleetTypeFilter, setFleetTypeFilter] = useState<FleetType | "">("");

  const { fleets, fleetsLoading, refreshFleets } = useFleet();

  useEffect(() => {
    void refreshFleets();
  }, [refreshFleets]);

  const filteredFleets = useMemo(() => {
    return (fleets || []).filter((f) => {
      const nameOk =
        !searchName ||
        f.name.toLowerCase().includes(searchName.toLowerCase());
      const mobileOk =
        !searchMobile || f.mobile.includes(searchMobile);
      const typeOk =
        !fleetTypeFilter || f.fleetType === fleetTypeFilter;

      return nameOk && mobileOk && typeOk;
    });
  }, [fleets, searchName, searchMobile, fleetTypeFilter]);

  const columns: Column<Fleet>[] = [
    {
      key: "index",
      label: "S.No",
      render: (_, i) => i + 1,
    },
    { key: "name", label: "Fleet Owner" },
    { key: "mobile", label: "Mobile" },
    { key: "city", label: "City" },
    {
      key: "fleetType",
      label: "Fleet Type",
    },
    {
      key: "status",
      label: "Status",
      render: (f) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            f.status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {f.status === "ACTIVE" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (f) => (
        <button
          onClick={() => setSelectedFleet(f)}
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
        <h1 className="text-xl font-semibold">Fleet Management</h1>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="md:hidden"
            onClick={() => setShowFilters((p) => !p)}
          >
            <Filter size={16} />
          </Button>

          <Button onClick={() => setOpenAdd(true)}>
            + Add Fleet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`
          grid gap-4
          grid-cols-1 md:grid-cols-3
          ${showFilters ? "block" : "hidden md:grid"}
        `}
      >
        <Input
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          placeholder="Search by Mobile"
          value={searchMobile}
          onChange={(e) => setSearchMobile(e.target.value)}
        />
        <Select
          value={fleetTypeFilter}
          onChange={(e) => setFleetTypeFilter(e.target.value as FleetType | "")}
          options={[
            { label: "All Fleet Types", value: "" },
            { label: "Individual", value: "INDIVIDUAL" },
            { label: "Company", value: "COMPANY" },
          ]}
        />
      </div>

      {/* Table */}
      {fleetsLoading ? (
        <div className="text-sm text-black/60">Loading fleets…</div>
      ) : (
        <Table columns={columns} data={filteredFleets} />
      )}

      {/* Add Fleet Modal */}
      <Modal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        title="Add Fleet"
      >
        <CreateNewFleet
          onClose={() => setOpenAdd(false)}
          onCreated={() => {
            toast.success("Fleet created");
            void refreshFleets();
            setOpenAdd(false);
          }}
        />
      </Modal>

      {/* Fleet Drawer */}
      <Drawer
        open={!!selectedFleet}
        onClose={() => setSelectedFleet(null)}
        title="Fleet Details"
      >
        <FleetDrawer
          fleet={selectedFleet}
          onDeactivated={() => {
            void refreshFleets();
          }}
        />
      </Drawer>
    </div>
  );
}
