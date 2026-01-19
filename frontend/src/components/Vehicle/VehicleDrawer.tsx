// // import { useEffect, useState } from 'react';
// // import toast from 'react-hot-toast';
// // import type { Vehicle } from "../../models/vehicle/vehicle";
// // import Input from "../ui/Input";
// // import Select from "../ui/Select";
// // import Button from "../ui/Button";
// // import { updateVehicleDetails, updateVehicleStatus } from '../../api/vehicle.api';
// // import { addVehicleToHub, getFleetHubs, removeVehicleFromHub } from '../../api/fleetHub.api';

// // type Props = {
// //   vehicle: Vehicle | null;
// //   fleetId: string;
// //   onClose?: () => void;
// //   onUpdated?: () => void;
// // };

// // type BodyType = 'SEDAN' | 'SUV' | 'HATCHBACK';
// // type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'EV';

// // function coerceBodyType(value: unknown): BodyType {
// //   return value === 'SEDAN' || value === 'SUV' || value === 'HATCHBACK' ? value : 'SEDAN';
// // }

// // function coerceFuelType(value: unknown): FuelType {
// //   return value === 'PETROL' || value === 'DIESEL' || value === 'CNG' || value === 'EV' ? value : 'PETROL';
// // }

// // export default function VehicleDrawer({ vehicle, fleetId, onClose, onUpdated }: Props) {
// //   const [number, setNumber] = useState('');
// //   const [brand, setBrand] = useState('');
// //   const [model, setModel] = useState('');
// //   const [bodyType, setBodyType] = useState<BodyType>('SEDAN');
// //   const [fuelType, setFuelType] = useState<FuelType>('PETROL');
// //   const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
// //   const [hubId, setHubId] = useState<string>(''); // '' => unassigned
// //   const [hubOptions, setHubOptions] = useState<Array<{ label: string; value: string }>>([
// //     { label: 'Unassigned', value: '' },
// //   ]);
// //   const [saving, setSaving] = useState(false);

// //   useEffect(() => {
// //     if (!vehicle) return;
// //     setNumber(vehicle.number);
// //     setBrand(vehicle.brand);
// //     setModel(vehicle.model);
// //     setBodyType(coerceBodyType(vehicle.bodyType));
// //     setFuelType(coerceFuelType(vehicle.fuelType));
// //     setStatus(vehicle.isActive ? 'Active' : 'Inactive');
// //     setHubId(vehicle.hubId || '');
// //   }, [vehicle]);

// //   useEffect(() => {
// //     if (!fleetId) {
// //       setHubOptions([{ label: 'Unassigned', value: '' }]);
// //       return;
// //     }
// //     let mounted = true;
// //     void (async () => {
// //       try {
// //         const hubs = await getFleetHubs(fleetId);
// //         if (!mounted) return;
// //         setHubOptions([
// //           { label: 'Unassigned', value: '' },
// //           ...(hubs || []).map((h) => ({
// //             label: h.address ? `${h.hubType} • ${h.address}` : String(h.hubType),
// //             value: h.id,
// //           })),
// //         ]);
// //       } catch {
// //         // best-effort
// //       }
// //     })();
// //     return () => {
// //       mounted = false;
// //     };
// //   }, [fleetId]);

// //   async function onSave() {
// //     if (!vehicle) return;
// //     // capture non-null id to avoid nullability issues in closures
// //     const vehicleId = vehicle.id;
// //     const prevHubId = vehicle.hubId || '';
// //     setSaving(true);
// //     try {
// //       await updateVehicleDetails(vehicleId, {
// //         brand: brand.trim(),
// //         model: model.trim(),
// //         bodyType,
// //         fuelType,
// //       });
// //       await updateVehicleStatus(vehicleId, status === 'Active');

// //       // Hub assignment (new)
// //       if (hubId !== prevHubId) {
// //         if (!hubId && prevHubId) {
// //           await removeVehicleFromHub(prevHubId, vehicleId);
// //         } else if (hubId) {
// //           await addVehicleToHub(hubId, vehicleId);
// //         }
// //       }

// //       toast.success('Vehicle updated');
// //       onUpdated?.();
// //       onClose?.();
// //     } catch (err: unknown) {
// //       const maybeAny = err as { response?: { data?: unknown } };
// //       const data = maybeAny.response?.data;
// //       const msg =
// //         data && typeof data === 'object' && 'message' in data
// //           ? String((data as Record<string, unknown>).message)
// //           : 'Failed to update vehicle';
// //       toast.error(msg);
// //     } finally {
// //       setSaving(false);
// //     }
// //   }

// //   if (!vehicle) return null;

// //   return (
// //     <div className="space-y-4">
// //       <Input
// //         label="Vehicle Number"
// //         value={number}
// //         onChange={(e) => setNumber(e.target.value)}
// //         disabled
// //       />

// //       <Input
// //         label="Brand"
// //         value={brand}
// //         onChange={(e) => setBrand(e.target.value)}
// //         disabled={saving}
// //       />

// //       <Input
// //         label="Model"
// //         value={model}
// //         onChange={(e) => setModel(e.target.value)}
// //         disabled={saving}
// //       />

// //       <Select
// //         label="Body Type"
// //         value={bodyType}
// //         onChange={(e) => setBodyType(e.target.value as typeof bodyType)}
// //         options={[
// //           { label: "SEDAN", value: "SEDAN" },
// //           { label: "SUV", value: "SUV" },
// //           { label: "HATCHBACK", value: "HATCHBACK" },
// //         ]}
// //         disabled={saving}
// //       />

// //       <Select
// //         label="Fuel Type"
// //         value={fuelType}
// //         onChange={(e) => setFuelType(e.target.value as typeof fuelType)}
// //         options={[
// //           { label: "PETROL", value: "PETROL" },
// //           { label: "DIESEL", value: "DIESEL" },
// //           { label: "CNG", value: "CNG" },
// //           { label: "EV", value: "EV" },
// //         ]}
// //         disabled={saving}
// //       />

// //       <Select
// //         label="Status"
// //         value={status}
// //         onChange={(e) => setStatus(e.target.value as typeof status)}
// //         options={[
// //           { label: "Active", value: "Active" },
// //           { label: "Inactive", value: "Inactive" },
// //         ]}
// //         disabled={saving}
// //       />

// //       <Select
// //         label="Hub"
// //         value={hubId}
// //         onChange={(e) => setHubId(e.target.value)}
// //         options={hubOptions}
// //         disabled={saving || !fleetId}
// //       />

// //       <Button
// //         className="w-full"
// //         disabled={saving}
// //         loading={saving}
// //         onClick={() => void onSave()}
// //       >
// //         Save Changes
// //       </Button>
// //     </div>
// //   );
// // }
// import { useEffect, useState } from 'react';
// import toast from 'react-hot-toast';
// import type { Vehicle } from "../../models/vehicle/vehicle";
// import Input from "../ui/Input";
// import Select from "../ui/Select";
// import Button from "../ui/Button";
// import { updateVehicleDetails, updateVehicleStatus } from '../../api/vehicle.api';
// import { addVehicleToHub, getFleetHubs, removeVehicleFromHub } from '../../api/fleetHub.api';

// type Props = {
//   vehicle: Vehicle | null;
//   fleetId: string;
//   onClose?: () => void;
//   onUpdated?: () => void;
// };

// type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'EV';

// function coerceFuelType(value: unknown): FuelType {
//   return value === 'PETROL' || value === 'DIESEL' || value === 'CNG' || value === 'EV' ? value : 'PETROL';
// }

// export default function VehicleDrawer({ vehicle, fleetId, onClose, onUpdated }: Props) {
//   const [number, setNumber] = useState('');
//   const [brand, setBrand] = useState('');
//   const [model, setModel] = useState('');
//   const [vehicleColor, setVehicleColor] = useState('');
//   const [fuelType, setFuelType] = useState<FuelType>('PETROL');
//   const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
//   const [hubId, setHubId] = useState<string>(''); // '' => unassigned
//   const [hubOptions, setHubOptions] = useState<Array<{ label: string; value: string }>>([
//     { label: 'Unassigned', value: '' },
//   ]);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (!vehicle) return;
//     setNumber(vehicle.number);
//     setBrand(vehicle.brand);
//     setModel(vehicle.model);
//     const color = vehicle.bodyType && vehicle.bodyType !== '-' ? vehicle.bodyType : '';
//     setVehicleColor(color);
//     setFuelType(coerceFuelType(vehicle.fuelType));
//     setStatus(vehicle.isActive ? 'Active' : 'Inactive');
//     setHubId(vehicle.hubId || '');
//   }, [vehicle]);

//   useEffect(() => {
//     if (!fleetId) {
//       setHubOptions([{ label: 'Unassigned', value: '' }]);
//       return;
//     }
//     let mounted = true;
//     void (async () => {
//       try {
//         const hubs = await getFleetHubs(fleetId);
//         if (!mounted) return;
//         setHubOptions([
//           { label: 'Unassigned', value: '' },
//           ...(hubs || []).map((h) => ({
//             label: h.address ? `${h.hubType} • ${h.address}` : String(h.hubType),
//             value: h.id,
//           })),
//         ]);
//       } catch {
//         // best-effort
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [fleetId]);

//   async function onSave() {
//     if (!vehicle) return;
//     // capture non-null id to avoid nullability issues in closures
//     const vehicleId = vehicle.id;
//     const prevHubId = vehicle.hubId || '';
//     setSaving(true);
//     try {
//       await updateVehicleDetails(vehicleId, {
//         brand: brand.trim() || undefined,
//         model: model.trim() || undefined,
//         vehicleColor: vehicleColor.trim() || undefined,
//         fuelType,
//       });
//       await updateVehicleStatus(vehicleId, status === 'Active');

//       // Hub assignment (new)
//       if (hubId !== prevHubId) {
//         if (!hubId && prevHubId) {
//           await removeVehicleFromHub(prevHubId, vehicleId);
//         } else if (hubId) {
//           await addVehicleToHub(hubId, vehicleId);
//         }
//       }

//       toast.success('Vehicle updated');
//       onUpdated?.();
//       onClose?.();
//     } catch (err: unknown) {
//       const maybeAny = err as { response?: { data?: unknown } };
//       const data = maybeAny.response?.data;
//       const msg =
//         data && typeof data === 'object' && 'message' in data
//           ? String((data as Record<string, unknown>).message)
//           : 'Failed to update vehicle';
//       toast.error(msg);
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (!vehicle) return null;

//   return (
//     <div className="space-y-4">
//       <Input
//         label="Vehicle Number"
//         value={number}
//         onChange={(e) => setNumber(e.target.value)}
//         disabled
//       />

//       <Input
//         label="Vehicle Name"
//         value={brand}
//         onChange={(e) => setBrand(e.target.value)}
//         disabled={saving}
//       />

//       <Input
//         label="Model"
//         value={model}
//         onChange={(e) => setModel(e.target.value)}
//         disabled={saving}
//       />

//       <Input
//         label="Vehicle Color"
//         value={vehicleColor}
//         onChange={(e) => setVehicleColor(e.target.value)}
//         disabled={saving}
//       />

//       <Select
//         label="Fuel Type"
//         value={fuelType}
//         onChange={(e) => setFuelType(e.target.value as typeof fuelType)}
//         options={[
//           { label: "PETROL", value: "PETROL" },
//           { label: "DIESEL", value: "DIESEL" },
//           { label: "CNG", value: "CNG" },
//           { label: "EV", value: "EV" },
//         ]}
//         disabled={saving}
//       />

//       <Select
//         label="Status"
//         value={status}
//         onChange={(e) => setStatus(e.target.value as typeof status)}
//         options={[
//           { label: "Active", value: "Active" },
//           { label: "Inactive", value: "Inactive" },
//         ]}
//         disabled={saving}
//       />

//       <Select
//         label="Hub"
//         value={hubId}
//         onChange={(e) => setHubId(e.target.value)}
//         options={hubOptions}
//         disabled={saving || !fleetId}
//       />

//       <Button
//         className="w-full"
//         disabled={saving}
//         loading={saving}
//         onClick={() => void onSave()}
//       >
//         Save Changes
//       </Button>
//     </div>
//   );
// }


import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import type { Vehicle } from "../../models/vehicle/vehicle";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

import {
  updateVehicleDetails,
  updateVehicleStatus,
} from '../../api/vehicle.api';

import {
  addVehicleToHub,
  getFleetHubs,
  removeVehicleFromHub,
} from '../../api/fleetHub.api';

type Props = {
  vehicle: Vehicle | null;
  fleetId: string;
  onClose?: () => void;
  onUpdated?: () => void;
};

type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
type Ownership = 'OWNED' | 'LEASED';

function coerceFuelType(value: unknown): FuelType {
  return value === 'PETROL' ||
    value === 'DIESEL' ||
    value === 'CNG' ||
    value === 'EV'
    ? value
    : 'PETROL';
}

export default function VehicleDrawer({
  vehicle,
  fleetId,
  onClose,
  onUpdated,
}: Props) {
  const [number, setNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [fleetMobileNumber, setFleetMobileNumber] = useState('');
  const [ownership, setOwnership] = useState<Ownership | ''>('');
  const [fuelType, setFuelType] = useState<FuelType>('PETROL');
  const [permitExpiry, setPermitExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [hubId, setHubId] = useState<string>('');
  const [hubOptions, setHubOptions] = useState<
    Array<{ label: string; value: string }>
  >([{ label: 'Unassigned', value: '' }]);

  const [saving, setSaving] = useState(false);

  /* ---------------- populate form ---------------- */
  useEffect(() => {
    if (!vehicle) return;

    setNumber(vehicle.number);
    setBrand(vehicle.brand || '');
    setModel(vehicle.model || '');
    setVehicleColor(vehicle.vehicleColor || '');
    setFleetMobileNumber(vehicle.fleetMobileNumber || '');
    setOwnership(vehicle.ownership || '');
    setFuelType(coerceFuelType(vehicle.fuelType));
    setPermitExpiry(vehicle.permitExpiry || '');
    setInsuranceExpiry(vehicle.insuranceExpiry || '');
    setStatus(vehicle.isActive ? 'Active' : 'Inactive');
    setHubId(vehicle.hubId || '');
  }, [vehicle]);

  /* ---------------- hubs ---------------- */
  useEffect(() => {
    if (!fleetId) {
      setHubOptions([{ label: 'Unassigned', value: '' }]);
      return;
    }

    let mounted = true;
    void (async () => {
      try {
        const hubs = await getFleetHubs(fleetId);
        if (!mounted) return;
        setHubOptions([
          { label: 'Unassigned', value: '' },
          ...(hubs || []).map((h) => ({
            label: h.address
              ? `${h.hubType} • ${h.address}`
              : String(h.hubType),
            value: h.id,
          })),
        ]);
      } catch {
        // silent fail
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fleetId]);

  /* ---------------- save ---------------- */
  async function onSave() {
    if (!vehicle) return;

    const vehicleId = vehicle.id;
    const prevHubId = vehicle.hubId || '';

    setSaving(true);
    try {
      await updateVehicleDetails(vehicleId, {
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        vehicleColor: vehicleColor.trim() || undefined,
        fuelType,
        ownership: ownership || undefined,
        permitExpiry: permitExpiry || undefined,
        insuranceExpiry: insuranceExpiry || undefined,
        fleetMobileNumber: fleetMobileNumber.trim() || undefined,
      });

      await updateVehicleStatus(vehicleId, status === 'Active');

      if (hubId !== prevHubId) {
        if (!hubId && prevHubId) {
          await removeVehicleFromHub(prevHubId, vehicleId);
        } else if (hubId) {
          await addVehicleToHub(hubId, vehicleId);
        }
      }

      toast.success('Vehicle updated');
      onUpdated?.();
      onClose?.();
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === 'object' && 'message' in data
          ? String((data as Record<string, unknown>).message)
          : 'Failed to update vehicle';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!vehicle) return null;

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-4">
      <Input label="Vehicle Number" value={number} disabled />

      <Input
        label="Vehicle Name"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Vehicle Model"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Vehicle Color"
        value={vehicleColor}
        onChange={(e) => setVehicleColor(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Fleet Mobile Number"
        value={fleetMobileNumber}
        onChange={(e) => setFleetMobileNumber(e.target.value)}
        disabled={saving}
      />

      <Select
        label="Ownership"
        value={ownership}
        onChange={(e) => setOwnership(e.target.value as Ownership | '')}
        options={[
          { label: 'Select ownership', value: '' },
          { label: 'Owned', value: 'OWNED' },
          { label: 'Leased', value: 'LEASED' },
        ]}
        disabled={saving}
      />

      <Select
        label="Fuel Type"
        value={fuelType}
        onChange={(e) => setFuelType(e.target.value as FuelType)}
        options={[
          { label: 'PETROL', value: 'PETROL' },
          { label: 'DIESEL', value: 'DIESEL' },
          { label: 'CNG', value: 'CNG' },
          { label: 'EV', value: 'EV' },
        ]}
        disabled={saving}
      />

      <Input
        label="Permit Expiry Date"
        type="date"
        value={permitExpiry}
        onChange={(e) => setPermitExpiry(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Insurance Expiry Date"
        type="date"
        value={insuranceExpiry}
        onChange={(e) => setInsuranceExpiry(e.target.value)}
        disabled={saving}
      />

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof status)}
        options={[
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ]}
        disabled={saving}
      />

      <Select
        label="Hub"
        value={hubId}
        onChange={(e) => setHubId(e.target.value)}
        options={hubOptions}
        disabled={saving || !fleetId}
      />

      <Button
        className="w-full"
        loading={saving}
        disabled={saving}
        onClick={() => void onSave()}
      >
        Save Changes
      </Button>
    </div>
  );
}
