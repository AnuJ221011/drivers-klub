import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Car, Filter, MoreVertical, Pencil, SlidersHorizontal } from 'lucide-react';

import Drawer from '../components/layout/Drawer';
import Table from '../components/ui/Table';
import DriverDrawer from '../components/driver/DriverDrawer';
import AddDriver from '../components/driver/AddDriver';
import Modal from '../components/layout/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import type { Column } from '../components/ui/Table';

import { getDriversByFleet } from '../api/driver.api';
import type { Driver } from '../models/driver/driver';
import { useFleet } from '../context/FleetContext';
import FleetSelectBar from '../components/fleet/FleetSelectBar';
import { getAssignmentsByFleet } from '../api/assignment.api';
import { getVehiclesByFleet } from '../api/vehicle.api';
import type { Vehicle } from '../models/vehicle/vehicle';
import type { AssignmentEntity } from '../models/assignment/assignment';
import AssignVehicleToDriverModal from '../components/driver/AssignVehicleToDriverModal';
import DriverPreferencesDrawer from '../components/driver/DriverPreferencesDrawer';
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

export default function DriverManagement() {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [open, setOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignedVehicleByDriverId, setAssignedVehicleByDriverId] = useState<Record<string, string>>({});
  const [assignments, setAssignments] = useState<AssignmentEntity[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hubs, setHubs] = useState<FleetHubEntity[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchName, setSearchName] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { effectiveFleetId } = useFleet();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDriver, setAssignDriver] = useState<Driver | null>(null);
  const [prefOpen, setPrefOpen] = useState(false);
  const [prefDriver, setPrefDriver] = useState<Driver | null>(null);
  const [actionMenuDriverId, setActionMenuDriverId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!actionMenuDriverId) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const el = actionMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setActionMenuDriverId(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActionMenuDriverId(null);
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [actionMenuDriverId]);

  const refreshDrivers = useCallback(async () => {
    if (!effectiveFleetId) {
      setDrivers([]);
      setAssignedVehicleByDriverId({});
      setAssignments([]);
      setVehicles([]);
      setHubs([]);
      return;
    }
    setLoading(true);
    try {
      const [data, assignments, vehicles, hubs] = await Promise.all([
        getDriversByFleet(effectiveFleetId),
        getAssignmentsByFleet(effectiveFleetId),
        getVehiclesByFleet(effectiveFleetId),
        getFleetHubs(effectiveFleetId),
      ]);

      console.log('Fetched drivers:', data);
      setDrivers(data);
      setAssignments(assignments || []);
      setVehicles(vehicles || []);
      setHubs(hubs || []);

      const vehicleLabelById = new Map<string, string>();
      for (const v of vehicles || []) {
        const label = v.model ? `${v.number} (${v.model})` : v.number;
        vehicleLabelById.set(v.id, label);
      }

      const next: Record<string, string> = {};
      for (const a of assignments || []) {
        if (a.status !== 'ACTIVE') continue;
        next[a.driverId] = vehicleLabelById.get(a.vehicleId) || a.vehicleId;
      }
      setAssignedVehicleByDriverId(next);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load drivers'));
    } finally {
      setLoading(false);
    }
  }, [effectiveFleetId]);

  const hubLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of hubs || []) {
      const type = h.hubType ? String(h.hubType) : 'Hub';
      const addr = h.address ? String(h.address) : '';
      map.set(h.id, addr ? `${type} • ${addr}` : type);
    }
    return map;
  }, [hubs]);

  useEffect(() => {
    void refreshDrivers();
  }, [refreshDrivers]);

  // Support deep-link from FleetDetails: /admin/drivers?openAdd=1
  useEffect(() => {
    if (searchParams.get('openAdd') !== '1') return;

    // Remove param immediately to avoid reopening on future renders
    const next = new URLSearchParams(searchParams);
    next.delete('openAdd');
    setSearchParams(next, { replace: true });

    if (!effectiveFleetId) return;
    setOpen(true);
    // best-effort: bring the modal trigger area into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [effectiveFleetId, searchParams, setSearchParams]);

  const filteredDrivers = useMemo(() => {
    const phoneNeedle = (searchPhone || '').trim();
    const nameNeedle = (searchName || '').trim().toLowerCase();

    return drivers.filter((d) => {
      const phoneOk = !phoneNeedle || (d.phone || '').includes(phoneNeedle);
      const nameOk = !nameNeedle || (d.name || '').toLowerCase().includes(nameNeedle);
      return phoneOk && nameOk;
    });
  }, [drivers, searchPhone, searchName]);

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
      key: "assignedVehicle",
      label: "Assigned Vehicle",
      render: (d) => assignedVehicleByDriverId[d.id] || "—",
    },
    {
      key: "hub",
      label: "Hub",
      render: (d) => {
        const id = d.hubId;
        if (!id) return "—";
        return hubLabelById.get(id) || id;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (d) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            d.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {d.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "availability",
      label: "Availability",
      render: (d) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            d.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {d.isAvailable ? 'Available' : 'Unavailable'}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (d) => (
        <div
          className="relative inline-flex z-10"
          ref={d.id === actionMenuDriverId ? actionMenuRef : undefined}
        >
          <button
            type="button"
            className="p-2 hover:bg-yellow-100 rounded"
            title="Actions"
            aria-haspopup="menu"
            aria-expanded={d.id === actionMenuDriverId}
            onClick={() => {
              setActionMenuDriverId((prev) => (prev === d.id ? null : d.id));
            }}
          >
            <MoreVertical size={16} />
          </button>

          {d.id === actionMenuDriverId ? (
            <div
              className="absolute right-0 mt-2 w-52 rounded-md border border-black/10 bg-white shadow-lg overflow-hidden z-10"
              role="menu"
            >
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-yellow-50"
                role="menuitem"
                onClick={() => {
                  setActionMenuDriverId(null);
                  setPrefDriver(d);
                  setPrefOpen(true);
                }}
              >
                <SlidersHorizontal size={16} />
                <span>Preferences</span>
              </button>
              <button
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-yellow-50 ${!d.hubId ? 'opacity-40 cursor-not-allowed' : ''}`}
                role="menuitem"
                onClick={() => {
                  setActionMenuDriverId(null);
                  setAssignDriver(d);
                  setAssignOpen(true);
                }}
              >
                <Car size={16} />
                <span>Assign vehicle</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-yellow-50"
                role="menuitem"
                onClick={() => {
                  setActionMenuDriverId(null);
                  setSelectedDriver(d);
                }}
              >
                <Pencil size={16} />
                <span>Edit driver</span>
              </button>
            </div>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">
            Drivers
          </h1>
          
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
            +Driver
          </Button>
        </div>

        <Modal open={open} onClose={() => setOpen(false)} title="Add Driver">
          <AddDriver
            onClose={() => setOpen(false)}
            onCreated={() => void refreshDrivers()}
          />
        </Modal>
      </div>

      {/* Filters */}
      
      <div className={`
          grid gap-4
          grid-cols-1 md:grid-cols-2
          ${showFilters ? "block" : "hidden md:grid"}
        `}>
        <Input
          placeholder="Search by Phone Number"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
        />
        <Input
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>

      {/* Table */}
      {!effectiveFleetId ? (
        <div className="text-sm text-black/60">Select a fleet to view drivers.</div>
      ) : loading ? (
        <div className="text-sm text-black/60">Loading drivers…</div>
      ) : (
        <Table data={filteredDrivers} columns={columns} />
      )}

      {/* Drawer */}
      <Drawer
        open={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
        title="Edit Driver"
      >
        <DriverDrawer
          driver={selectedDriver}
          fleetId={effectiveFleetId || ''}
          onClose={() => setSelectedDriver(null)}
          onUpdated={() => void refreshDrivers()}
        />
      </Drawer>

      <Drawer
        open={prefOpen && !!prefDriver}
        onClose={() => {
          setPrefOpen(false);
          setPrefDriver(null);
        }}
        title="Driver Preferences"
      >
        {prefDriver ? <DriverPreferencesDrawer driverId={prefDriver.id} /> : null}
      </Drawer>

      {effectiveFleetId && assignDriver && (
        <AssignVehicleToDriverModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          fleetId={effectiveFleetId}
          driver={assignDriver}
          vehicles={vehicles}
          assignments={assignments}
          onAssigned={() => void refreshDrivers()}
        />
      )}
    </div>
  );
}