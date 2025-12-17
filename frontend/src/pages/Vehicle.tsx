import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil } from "lucide-react";

import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import Drawer from "../components/layout/Drawer";
import Modal from "../components/layout/Modal";

import VehicleDrawer from "../components/Vehicle/VehicleDrawer";
import AddVehicle from "../components/Vehicle/AddVehicle";

import type { Column } from "../components/ui/Table";
import { getVehicles, type Vehicle } from '../api/vehicle.api';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const maybeAny = err as { response?: { data?: unknown } };
    const data = maybeAny.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      return String((data as Record<string, unknown>).message);
    }
  }
  return fallback;
}

export default function VehicleManagement() {
  const [open, setOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchVehicleNo, setSearchVehicleNo] = useState("");
  const [searchBrand, setSearchBrand] = useState("");

  async function refreshVehicles() {
    setLoading(true);
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const numberNeedle = (searchVehicleNo || '').trim().toLowerCase();
    const brandNeedle = (searchBrand || '').trim().toLowerCase();

    return vehicles.filter((v) => {
      const numOk = !numberNeedle || (v.number || '').toLowerCase().includes(numberNeedle);
      const brandOk = !brandNeedle || (v.brand || '').toLowerCase().includes(brandNeedle);
      return numOk && brandOk;
    });
  }, [vehicles, searchVehicleNo, searchBrand]);

  const columns: Column<Vehicle>[] = [
    {
      key: "index",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    { key: "number", label: "Vehicle Number" },
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "bodyType", label: "Body Type" },
    { key: "fuelType", label: "Fuel Type" },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {v.isActive ? 'Active' : 'Inactive'}
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
                value={searchVehicleNo}
                onChange={(e) => setSearchVehicleNo(e.target.value)}
              />
              <Input
                placeholder="Search by brand"
                value={searchBrand}
                onChange={(e) => setSearchBrand(e.target.value)}
              />
            </div>

      {/* Add Vehicle Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Vehicle"
      >
        <AddVehicle
          onClose={() => setOpen(false)}
          onCreated={() => void refreshVehicles()}
        />
      </Modal>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-black/60">Loading vehicles…</div>
      ) : (
        <Table columns={columns} data={filteredVehicles} />
      )}

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