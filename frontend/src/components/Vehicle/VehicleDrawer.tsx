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

export default function VehicleDrawer({ vehicle, onClose, onUpdated }: Props) {
  if (!vehicle) return null;

  const [number, setNumber] = useState(vehicle.number);
  const [brand, setBrand] = useState(vehicle.brand);
  const [model, setModel] = useState(vehicle.model);
  const [bodyType, setBodyType] = useState<'SEDAN' | 'SUV' | 'HATCHBACK'>(
    (vehicle.bodyType as 'SEDAN' | 'SUV' | 'HATCHBACK') || 'SEDAN',
  );
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL' | 'CNG' | 'EV'>(
    (vehicle.fuelType as 'PETROL' | 'DIESEL' | 'CNG' | 'EV') || 'PETROL',
  );
  const [status, setStatus] = useState<'Active' | 'Inactive'>(vehicle.isActive ? 'Active' : 'Inactive');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNumber(vehicle.number);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setBodyType((vehicle.bodyType as any) || 'SEDAN');
    setFuelType((vehicle.fuelType as any) || 'PETROL');
    setStatus(vehicle.isActive ? 'Active' : 'Inactive');
  }, [vehicle]);

  async function onSave() {
    setSaving(true);
    try {
      await updateVehicleDetails(vehicle.id, {
        number: number.trim(),
        brand: brand.trim(),
        model: model.trim(),
        bodyType,
        fuelType,
      });
      await updateVehicleStatus(vehicle.id, status === 'Active');
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