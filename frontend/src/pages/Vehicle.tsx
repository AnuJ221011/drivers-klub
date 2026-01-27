import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Filter, Pencil } from "lucide-react";

import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import Drawer from "../components/layout/Drawer";
import Modal from "../components/layout/Modal";

import VehicleDrawer from "../components/Vehicle/VehicleDrawer";
import AddVehicle from "../components/Vehicle/AddVehicle";
import FleetSelectBar from '../components/fleet/FleetSelectBar';

import type { Column } from "../components/ui/Table";
import { getVehiclesByFleet } from '../api/vehicle.api';
import type { Vehicle } from '../models/vehicle/vehicle';
import { useFleet } from '../context/FleetContext';
import { getFleetHubs } from '../api/fleetHub.api';
import type { FleetHubEntity } from '../api/fleetHub.api';

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
  const [hubs, setHubs] = useState<FleetHubEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchVehicleNo, setSearchVehicleNo] = useState("");
  const [searchBrand, setSearchBrand] = useState("");
  const { effectiveFleetId } = useFleet();
  const [searchParams, setSearchParams] = useSearchParams();

  const refreshVehicles = useCallback(async () => {
    if (!effectiveFleetId) {
      setVehicles([]);
      setHubs([]);
      return;
    }
    setLoading(true);
    try {
      const [data, hubs] = await Promise.all([
        getVehiclesByFleet(effectiveFleetId),
        getFleetHubs(effectiveFleetId),
      ]);
      setVehicles(data);
      setHubs(hubs || []);
      console.log("Fetched Vehicles data:", data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }, [effectiveFleetId]);

  useEffect(() => {
    void refreshVehicles();
  }, [refreshVehicles]);

  // Support deep-link from FleetDetails: /admin/vehicles?openAdd=1
  useEffect(() => {
    if (searchParams.get('openAdd') !== '1') return;

    // Remove param immediately to avoid reopening on future renders
    const next = new URLSearchParams(searchParams);
    next.delete('openAdd');
    setSearchParams(next, { replace: true });

    if (!effectiveFleetId) return;
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [effectiveFleetId, searchParams, setSearchParams]);

  const filteredVehicles = useMemo(() => {
    const numberNeedle = (searchVehicleNo || '').trim().toLowerCase();
    const brandNeedle = (searchBrand || '').trim().toLowerCase();

    return vehicles.filter((v) => {
      const numOk = !numberNeedle || (v.number || '').toLowerCase().includes(numberNeedle);
      const brandOk = !brandNeedle || (v.brand || '').toLowerCase().includes(brandNeedle);
      return numOk && brandOk;
    });
  }, [vehicles, searchVehicleNo, searchBrand]);

  const hubLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of hubs || []) {
      const type = h.hubType ? String(h.hubType) : 'Hub';
      const addr = h.address ? String(h.address) : '';
      map.set(h.id, addr ? `${type} • ${addr}` : type);
    }
    return map;
  }, [hubs]);

  const columns: Column<Vehicle>[] = [
    {
      key: "index",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    { key: "number", label: "Vehicle Number" },
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "vehicleColor", label: "Vehicle Color" },
    { key: "fuelType", label: "Fuel Type" },
    {
      key: "hub",
      label: "Hub",
      render: (v) => {
        const id = v.hubId;
        if (!id) return "—";
        return hubLabelById.get(id) || id;
      },
    },
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

  console.log("Filtered Vehicles:", filteredVehicles);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Vehicles</h1>
          <FleetSelectBar className="w-72" />
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile filter toggle */}
          <Button
                variant="secondary"
                className="md:hidden"
                onClick={() => setShowFilters((p) => !p)}
          >
                <Filter size={16} />
          </Button>

          <Button onClick={() => setOpen(true)} disabled={!effectiveFleetId}>
            + Vehicle
          </Button>
        </div>
      </div>

      {/* Filters */}
        <div
            className={`
            overflow-hidden transition-all duration-300
            ${showFilters ? "max-h-96" : "max-h-0 md:max-h-none"}
            `}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
      {!effectiveFleetId ? (
        <div className="text-sm text-black/60">Select a fleet to view vehicles.</div>
      ) : loading ? (
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
        <VehicleDrawer
          vehicle={selectedVehicle}
          fleetId={effectiveFleetId || ''}
          onClose={() => setSelectedVehicle(null)}
          onUpdated={() => void refreshVehicles()}
        />
      </Drawer>
    </div>
  );
}