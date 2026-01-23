
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Car,
  Filter,
  MoreVertical,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react';
import { createPortal } from 'react-dom';

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

/* ---------------- constants for menu ---------------- */
const ACTION_MENU_WIDTH = 208;   // w-52
const ACTION_MENU_HEIGHT = 140;  // approx height of 3 items
const MENU_GAP = 6;
/* ---------------------------------------------------- */

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
  const { effectiveFleetId } = useFleet();
  const [searchParams, setSearchParams] = useSearchParams();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<AssignmentEntity[]>([]);
  const [hubs, setHubs] = useState<FleetHubEntity[]>([]);
  const [assignedVehicleByDriverId, setAssignedVehicleByDriverId] =
    useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [searchPhone, setSearchPhone] = useState('');
  const [searchName, setSearchName] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDriver, setAssignDriver] = useState<Driver | null>(null);

  const [prefOpen, setPrefOpen] = useState(false);
  const [prefDriver, setPrefDriver] = useState<Driver | null>(null);

  const [actionMenuDriverId, setActionMenuDriverId] = useState<string | null>(
    null
  );
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- close menu on outside / ESC ---------------- */
  useEffect(() => {
    if (!actionMenuDriverId) return;

    const onMouseDown = (e: MouseEvent) => {
      if (
        actionMenuRef.current &&
        e.target instanceof Node &&
        !actionMenuRef.current.contains(e.target)
      ) {
        setActionMenuDriverId(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActionMenuDriverId(null);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [actionMenuDriverId]);
  /* ------------------------------------------------------------- */

  const refreshDrivers = useCallback(async () => {
    if (!effectiveFleetId) return;

    setLoading(true);
    try {
      const [drivers, assignments, vehicles, hubs] = await Promise.all([
        getDriversByFleet(effectiveFleetId),
        getAssignmentsByFleet(effectiveFleetId),
        getVehiclesByFleet(effectiveFleetId),
        getFleetHubs(effectiveFleetId),
      ]);

      setDrivers(drivers || []);
      setAssignments(assignments || []);
      setVehicles(vehicles || []);
      setHubs(hubs || []);

      const vehicleLabelById = new Map<string, string>();
      vehicles?.forEach((v) => {
        vehicleLabelById.set(
          v.id,
          v.model ? `${v.number} (${v.model})` : v.number
        );
      });

      const map: Record<string, string> = {};
      assignments?.forEach((a) => {
        if (a.status === 'ACTIVE') {
          map[a.driverId] =
            vehicleLabelById.get(a.vehicleId) || a.vehicleId;
        }
      });

      setAssignedVehicleByDriverId(map);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load drivers'));
    } finally {
      setLoading(false);
    }
  }, [effectiveFleetId]);

  useEffect(() => {
    void refreshDrivers();
  }, [refreshDrivers]);

  /* deep link: ?openAdd=1 */
  useEffect(() => {
    if (searchParams.get('openAdd') !== '1') return;
    const next = new URLSearchParams(searchParams);
    next.delete('openAdd');
    setSearchParams(next, { replace: true });
    setOpen(true);
  }, [searchParams, setSearchParams]);

  const hubLabelById = useMemo(() => {
    const map = new Map<string, string>();
    hubs.forEach((h) => {
      const type = h.hubType || 'Hub';
      const addr = h.address || '';
      map.set(h.id, addr ? `${type} • ${addr}` : type);
    });
    return map;
  }, [hubs]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const phoneOk =
        !searchPhone || (d.phone || '').includes(searchPhone);
      const nameOk =
        !searchName ||
        (d.name || '').toLowerCase().includes(searchName.toLowerCase());
      return phoneOk && nameOk;
    });
  }, [drivers, searchPhone, searchName]);

  const columns: Column<Driver>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'name', label: 'Driver Name' },
    { key: 'phone', label: 'Phone Number' },
    {
      key: 'vehicle',
      label: 'Assigned Vehicle',
      render: (d) => assignedVehicleByDriverId[d.id] || '—',
    },
    {
      key: 'hub',
      label: 'Hub',
      render: (d) => (d.hubId ? hubLabelById.get(d.hubId) || d.hubId : '—'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (d) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            d.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {d.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'availability',
      label: 'Availability',
      render: (d) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            d.isAvailable
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {d.isAvailable ? 'Available' : 'Unavailable'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (d) => (
        <button
          className="p-2 hover:bg-yellow-100 rounded"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const openUp =
              spaceBelow < ACTION_MENU_HEIGHT && spaceAbove > spaceBelow;

            setActionMenuDriverId(d.id);
            setMenuPosition({
              top: openUp
                ? rect.top - ACTION_MENU_HEIGHT - MENU_GAP
                : rect.bottom + MENU_GAP,
              left: Math.min(
                rect.right - ACTION_MENU_WIDTH,
                window.innerWidth - ACTION_MENU_WIDTH - 8
              ),
            });
          }}
        >
          <MoreVertical size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Drivers</h1>
        <div className="flex gap-2">
          <FleetSelectBar className="w-72" />
          <Button
            variant="secondary"
            className="md:hidden"
            onClick={() => setShowFilters((p) => !p)}
          >
            <Filter size={16} />
          </Button>
          <Button onClick={() => setOpen(true)} disabled={!effectiveFleetId} className='w-30'>
            + Driver
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
          showFilters ? 'block' : 'hidden md:grid'
        }`}
      >
        <Input
          placeholder="Search by Phone"
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
      {loading ? (
        <div className="text-sm text-black/60">Loading drivers…</div>
      ) : (
        <Table data={filteredDrivers} columns={columns} />
      )}

      {/* Add */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Driver">
        <AddDriver onClose={() => setOpen(false)} onCreated={refreshDrivers} />
      </Modal>

      {/* Edit */}
      <Drawer
        open={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
        title="Edit Driver"
      >
        <DriverDrawer
          driver={selectedDriver}
          fleetId={effectiveFleetId || ''}
          onClose={() => setSelectedDriver(null)}
          onUpdated={refreshDrivers}
        />
      </Drawer>

      {/* Preferences */}
      <Drawer
        open={prefOpen}
        onClose={() => setPrefOpen(false)}
        title="Driver Preferences"
      >
        {prefDriver && (
          <DriverPreferencesDrawer driverId={prefDriver.id} />
        )}
      </Drawer>

      {/* Assign vehicle */}
      {assignDriver && effectiveFleetId && (
        <AssignVehicleToDriverModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          fleetId={effectiveFleetId}
          driver={assignDriver}
          vehicles={vehicles}
          assignments={assignments}
          onAssigned={refreshDrivers}
        />
      )}

      {/* Action Menu (Portal) */}
      {actionMenuDriverId &&
        menuPosition &&
        createPortal(
          <div
            ref={actionMenuRef}
            className="fixed w-52 bg-white border rounded-md shadow-lg z-[9999]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <button
              className="w-full px-3 py-2 flex gap-2 hover:bg-yellow-50"
              onClick={() => {
                setPrefDriver(
                  drivers.find((d) => d.id === actionMenuDriverId) || null
                );
                setPrefOpen(true);
                setActionMenuDriverId(null);
              }}
            >
              <SlidersHorizontal size={16} /> Preferences
            </button>

            <button
              className="w-full px-3 py-2 flex gap-2 hover:bg-yellow-50"
              onClick={() => {
                setAssignDriver(
                  drivers.find((d) => d.id === actionMenuDriverId) || null
                );
                setAssignOpen(true);
                setActionMenuDriverId(null);
              }}
            >
              <Car size={16} /> Assign vehicle
            </button>

            <button
              className="w-full px-3 py-2 flex gap-2 hover:bg-yellow-50"
              onClick={() => {
                setSelectedDriver(
                  drivers.find((d) => d.id === actionMenuDriverId) || null
                );
                setActionMenuDriverId(null);
              }}
            >
              <Pencil size={16} /> Edit driver
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
