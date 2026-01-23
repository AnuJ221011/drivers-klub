// import { useCallback, useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import toast from "react-hot-toast";
// import { Car } from "lucide-react";
// import Button from "../../../ui/Button";
// import Table from "../../../ui/Table";
// import { getDriversByFleet } from "../../../../api/driver.api";
// import type { Driver } from "../../../../models/driver/driver";
// import { getAssignmentsByFleet } from "../../../../api/assignment.api";
// import { getVehiclesByFleet } from "../../../../api/vehicle.api";
// import type { AssignmentEntity } from "../../../../models/assignment/assignment";
// import type { Vehicle } from "../../../../models/vehicle/vehicle";
// import AssignVehicleToDriverModal from "../../../driver/AssignVehicleToDriverModal";
// import { useFleet } from "../../../../context/FleetContext";
// import { getFleetHubs } from "../../../../api/fleetHub.api";
// import type { FleetHubEntity } from "../../../../api/fleetHub.api";
// import { useMemo } from "react";


// export default function FleetDrivers() {
//   const { id: fleetId } = useParams();
//   const navigate = useNavigate();
//   const { setActiveFleetId } = useFleet();
//   const [rows, setRows] = useState<Driver[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [assignedVehicleByDriverId, setAssignedVehicleByDriverId] = useState<Record<string, string>>({});
//   const [assignments, setAssignments] = useState<AssignmentEntity[]>([]);
//   const [vehicles, setVehicles] = useState<Vehicle[]>([]);
//   const [assignOpen, setAssignOpen] = useState(false);
//   const [assignDriver, setAssignDriver] = useState<Driver | null>(null);
//   const [hubs, setHubs] = useState<FleetHubEntity[]>([]);


//   const refresh = useCallback(async () => {
//     if (!fleetId) return;
//     setLoading(true);
//     try {
//       const [drivers, assignments, vehicles, hubs] = await Promise.all([
//         getDriversByFleet(fleetId),
//         getAssignmentsByFleet(fleetId),
//         getVehiclesByFleet(fleetId),
//         getFleetHubs(fleetId), // ✅ add this
//       ]);

//       setRows(drivers || []);
//       setAssignments(assignments || []);
//       setVehicles(vehicles || []);
//       setHubs(hubs || []);

//       const vehicleLabelById = new Map<string, string>();
//       for (const v of vehicles || []) {
//         const label = v.model ? `${v.number} (${v.model})` : v.number;
//         vehicleLabelById.set(v.id, label);
//       }

//       const next: Record<string, string> = {};
//       for (const a of assignments || []) {
//         if (a.status !== "ACTIVE") continue;
//         next[a.driverId] = vehicleLabelById.get(a.vehicleId) || a.vehicleId;
//       }
//       setAssignedVehicleByDriverId(next);
//     } catch (err: unknown) {
//       const maybeAny = err as { response?: { data?: unknown } };
//       const data = maybeAny.response?.data;
//       const msg =
//         data && typeof data === "object" && "message" in data
//           ? String((data as Record<string, unknown>).message)
//           : "Failed to load drivers";
//       toast.error(msg);
//     } finally {
//       setLoading(false);
//     }
//   }, [fleetId]);

//   const hubLabelById = useMemo(() => {
//       const map = new Map<string, string>();

//       for (const h of hubs) {
//         const type = h.hubType || "Hub";
//         const addr = h.address || "";
//         map.set(h.id, addr ? `${type} • ${addr}` : type);
//       }

//       return map;
//     }, [hubs]);



//     useEffect(() => {
//       void refresh();
//     }, [refresh]);

//   return (
//     <div className="space-y-4">
//       <div className="flex justify-end">
//         <Button
//           onClick={() => {
//             if (!fleetId) return;
//             setActiveFleetId(fleetId);
//             navigate("/admin/drivers?openAdd=1");
//           }}
//         >
//           + Add Drivers
//         </Button>
//       </div>

//       {loading ? (
//         <div className="text-sm text-black/60">Loading drivers…</div>
//       ) : (
//         <Table
//           columns={[
//             { key: "index", label: "S.No", render: (_d, i) => i + 1 },
//             { key: "name", label: "Name" },
//             { key: "phone", label: "Phone" },
//             {
//   key: "assignedVehicle",
//   label: "Assigned Vehicle",
//   render: (d) => assignedVehicleByDriverId[d.id] || "—",
// },
// {
//   key: "hub",
//   label: "Hub",
//   render: (d) => {
//     if (!d.hubId) return "—";
//     return hubLabelById.get(d.hubId) || d.hubId;
//   },
// },
// {
//   key: "isActive",
//   label: "Active",
//   render: (d) => (
//     <span
//       className={`px-2 py-1 rounded-full text-xs font-medium ${
//         d.isActive
//           ? "bg-green-100 text-green-700"
//           : "bg-red-100 text-red-700"
//       }`}
//     >
//       {d.isActive ? "Active" : "Inactive"}
//     </span>
//   ),
// },

           

//             {
//               key: "isAvailable",
//               label: "Availability",
//               render: (d) => (
//                 <span
//                   className={`px-2 py-1 rounded-full text-xs font-medium ${
//                     d.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-300 text-gray-800"
//                   }`}
//                 >
//                   {d.isAvailable ? "Available" : "Unavailable"}
//                 </span>
//               ),
//             },
//             {
//               key: "actions",
//               label: "Actions",
//               render: (d) => (
//                 <button
//                   onClick={() => {
//                     setAssignDriver(d);
//                     setAssignOpen(true);
//                   }}
//                   className="p-2 hover:bg-yellow-100 rounded"
//                   title="Assign vehicle"
//                 >
//                   <Car size={16} />
//                 </button>
//               ),
//             },
//           ]}
//           data={rows}
//         />
//       )}

//       {fleetId && assignDriver && (
//         <AssignVehicleToDriverModal
//           open={assignOpen}
//           onClose={() => setAssignOpen(false)}
//           fleetId={fleetId}
//           driver={assignDriver}
//           vehicles={vehicles}
//           assignments={assignments}
//           onAssigned={() => void refresh()}
//         />
//       )}
//     </div>
//   );
// }


import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Car,
  MoreVertical,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react';
import { createPortal } from 'react-dom';

import Button from '../../../ui/Button';
import Table from '../../../ui/Table';
import Drawer from '../../../layout/Drawer';

import { getDriversByFleet } from '../../../../api/driver.api';
import { getAssignmentsByFleet } from '../../../../api/assignment.api';
import { getVehiclesByFleet } from '../../../../api/vehicle.api';
import { getFleetHubs } from '../../../../api/fleetHub.api';

import type { Driver } from '../../../../models/driver/driver';
import type { AssignmentEntity } from '../../../../models/assignment/assignment';
import type { Vehicle } from '../../../../models/vehicle/vehicle';
import type { FleetHubEntity } from '../../../../api/fleetHub.api';

import AssignVehicleToDriverModal from '../../../driver/AssignVehicleToDriverModal';
import DriverDrawer from '../../../driver/DriverDrawer';
import DriverPreferencesDrawer from '../../../driver/DriverPreferencesDrawer';

import { useFleet } from '../../../../context/FleetContext';

/* ---------------- constants (SAME AS DriverManagement) ---------------- */
const ACTION_MENU_WIDTH = 208; // w-52
const ACTION_MENU_HEIGHT = 140;
const MENU_GAP = 6;
/* -------------------------------------------------------------------- */

export default function FleetDrivers() {
  const { id: fleetId } = useParams();
  const navigate = useNavigate();
  const { setActiveFleetId } = useFleet();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<AssignmentEntity[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hubs, setHubs] = useState<FleetHubEntity[]>([]);
  const [assignedVehicleByDriverId, setAssignedVehicleByDriverId] =
    useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);

  /* ---- Assign Vehicle ---- */
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDriver, setAssignDriver] = useState<Driver | null>(null);

  /* ---- Edit Driver ---- */
  const [selectedDriver, setSelectedDriver] =
    useState<Driver | null>(null);

  /* ---- Preferences ---- */
  const [prefOpen, setPrefOpen] = useState(false);
  const [prefDriver, setPrefDriver] = useState<Driver | null>(null);

  /* ---- Action Menu ---- */
  const [actionMenuDriverId, setActionMenuDriverId] =
    useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  /* -------- close menu on outside click / ESC -------- */
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
  /* -------------------------------------------------- */

  const refresh = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);

    try {
      const [drivers, assignments, vehicles, hubs] = await Promise.all([
        getDriversByFleet(fleetId),
        getAssignmentsByFleet(fleetId),
        getVehiclesByFleet(fleetId),
        getFleetHubs(fleetId),
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
    } catch {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [fleetId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hubLabelById = useMemo(() => {
    const map = new Map<string, string>();
    hubs.forEach((h) => {
      const type = h.hubType || 'Hub';
      const addr = h.address || '';
      map.set(h.id, addr ? `${type} • ${addr}` : type);
    });
    return map;
  }, [hubs]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (!fleetId) return;
            setActiveFleetId(fleetId);
            navigate('/admin/drivers?openAdd=1');
          }}
        >
          + Add Drivers
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading drivers…</div>
      ) : (
        <Table
          data={drivers}
          columns={[
            { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            {
              key: 'vehicle',
              label: 'Assigned Vehicle',
              render: (d) =>
                assignedVehicleByDriverId[d.id] || '—',
            },
            {
              key: 'hub',
              label: 'Hub',
              render: (d) =>
                d.hubId
                  ? hubLabelById.get(d.hubId) || d.hubId
                  : '—',
            },
            {
              key: 'active',
              label: 'Active',
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
              key: 'available',
              label: 'Availability',
              render: (d) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    d.isAvailable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-800'
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
                    const rect =
                      e.currentTarget.getBoundingClientRect();

                    const spaceBelow =
                      window.innerHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    const openUp =
                      spaceBelow < ACTION_MENU_HEIGHT &&
                      spaceAbove > spaceBelow;

                    setActionMenuDriverId(d.id);
                    setMenuPosition({
                      top: openUp
                        ? rect.top -
                          ACTION_MENU_HEIGHT -
                          MENU_GAP
                        : rect.bottom + MENU_GAP,
                      left: Math.min(
                        rect.right - ACTION_MENU_WIDTH,
                        window.innerWidth -
                          ACTION_MENU_WIDTH -
                          8
                      ),
                    });
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              ),
            },
          ]}
        />
      )}

      {/* -------- Assign Vehicle -------- */}
      {fleetId && assignDriver && (
        <AssignVehicleToDriverModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          fleetId={fleetId}
          driver={assignDriver}
          vehicles={vehicles}
          assignments={assignments}
          onAssigned={refresh}
        />
      )}

      {/* -------- Edit Driver -------- */}
      <Drawer
        open={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
        title="Edit Driver"
      >
        {selectedDriver && fleetId && (
          <DriverDrawer
            driver={selectedDriver}
            fleetId={fleetId}
            onClose={() => setSelectedDriver(null)}
            onUpdated={refresh}
          />
        )}
      </Drawer>

      {/* -------- Preferences -------- */}
      <Drawer
        open={prefOpen}
        onClose={() => setPrefOpen(false)}
        title="Driver Preferences"
      >
        {prefDriver && (
          <DriverPreferencesDrawer
            driverId={prefDriver.id}
          />
        )}
      </Drawer>

      {/* -------- Action Menu -------- */}
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
                  drivers.find(
                    (d) => d.id === actionMenuDriverId
                  ) || null
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
                  drivers.find(
                    (d) => d.id === actionMenuDriverId
                  ) || null
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
                  drivers.find(
                    (d) => d.id === actionMenuDriverId
                  ) || null
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
