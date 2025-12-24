import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Vehicle } from "../../models/vehicle/vehicle";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { updateVehicleDetails, updateVehicleStatus } from '../../api/vehicle.api';

type Props = {
  vehicle: Vehicle | null;
  onClose?: () => void;
  onUpdated?: () => void;
};

type BodyType = 'SEDAN' | 'SUV' | 'HATCHBACK';
type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'EV';

function coerceBodyType(value: unknown): BodyType {
  return value === 'SEDAN' || value === 'SUV' || value === 'HATCHBACK' ? value : 'SEDAN';
}

function coerceFuelType(value: unknown): FuelType {
  return value === 'PETROL' || value === 'DIESEL' || value === 'CNG' || value === 'EV' ? value : 'PETROL';
}

export default function VehicleDrawer({ vehicle, onClose, onUpdated }: Props) {
  const [number, setNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [bodyType, setBodyType] = useState<BodyType>('SEDAN');
  const [fuelType, setFuelType] = useState<FuelType>('PETROL');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vehicle) return;
    setNumber(vehicle.number);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setBodyType(coerceBodyType(vehicle.bodyType));
    setFuelType(coerceFuelType(vehicle.fuelType));
    setStatus(vehicle.isActive ? 'Active' : 'Inactive');
  }, [vehicle]);

  async function onSave() {
    if (!vehicle) return;
    // capture non-null id to avoid nullability issues in closures
    const vehicleId = vehicle.id;
    setSaving(true);
    try {
      await updateVehicleDetails(vehicleId, {
        number: number.trim(),
        brand: brand.trim(),
        model: model.trim(),
        bodyType,
        fuelType,
      });
      await updateVehicleStatus(vehicleId, status === 'Active');
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

  return (
    <div className="space-y-4">
      <Input
        label="Vehicle Number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Brand"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Model"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        disabled={saving}
      />

      <Select
        label="Body Type"
        value={bodyType}
        onChange={(e) => setBodyType(e.target.value as typeof bodyType)}
        options={[
          { label: "SEDAN", value: "SEDAN" },
          { label: "SUV", value: "SUV" },
          { label: "HATCHBACK", value: "HATCHBACK" },
        ]}
        disabled={saving}
      />

      <Select
        label="Fuel Type"
        value={fuelType}
        onChange={(e) => setFuelType(e.target.value as typeof fuelType)}
        options={[
          { label: "PETROL", value: "PETROL" },
          { label: "DIESEL", value: "DIESEL" },
          { label: "CNG", value: "CNG" },
          { label: "EV", value: "EV" },
        ]}
        disabled={saving}
      />

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof status)}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
        disabled={saving}
      />

      <Button
        className="w-full"
        disabled={saving}
        loading={saving}
        onClick={() => void onSave()}
      >
        Save Changes
      </Button>
    </div>
  );
}