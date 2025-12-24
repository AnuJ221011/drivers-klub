import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Filter, Pencil } from 'lucide-react';

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
  const [searchPhone, setSearchPhone] = useState('');
  const [searchName, setSearchName] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { effectiveFleetId } = useFleet();

  const refreshDrivers = useCallback(async () => {
    if (!effectiveFleetId) {
      setDrivers([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getDriversByFleet(effectiveFleetId);
      setDrivers(data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load drivers'));
    } finally {
      setLoading(false);
    }
  }, [effectiveFleetId]);

  useEffect(() => {
    void refreshDrivers();
  }, [refreshDrivers]);

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
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Drivers</h1>
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
          onClose={() => setSelectedDriver(null)}
          onUpdated={() => void refreshDrivers()}
        />
      </Drawer>
    </div>
  );
}