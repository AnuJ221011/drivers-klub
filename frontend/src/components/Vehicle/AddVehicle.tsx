import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

import { createVehicle } from '../../api/vehicle.api';
import { useFleet } from '../../context/FleetContext';

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

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddVehicle({ onClose, onCreated }: Props) {
  const [number, setNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [bodyType, setBodyType] = useState<'SEDAN' | 'SUV' | 'HATCHBACK'>('SEDAN');
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL' | 'CNG' | 'EV'>('PETROL');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);
  const { effectiveFleetId } = useFleet();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!number.trim()) return toast.error('Please enter vehicle number');
    if (!brand.trim()) return toast.error('Please enter brand');
    if (!model.trim()) return toast.error('Please enter model');
    if (!bodyType) return toast.error('Please select body type');
    if (!effectiveFleetId) return toast.error('No fleet selected/available');

    setSaving(true);
    try {
      await createVehicle({
        number: number.trim(),
        brand: brand.trim(),
        model: model.trim(),
        bodyType,
        fuelType,
        isActive: status === 'Active',
        fleetId: effectiveFleetId,
      });
      toast.success('Vehicle created');
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create vehicle'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="
        space-y-4
        max-h-[70vh]
        overflow-y-auto
        pr-1
      "
    >
      <Input
        label="Vehicle Number"
        placeholder="DL 01 AB 1234"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Brand"
        placeholder="Toyota"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Model"
        placeholder="Innova"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        disabled={saving}
      />

      <Select
        label="Body Type"
        value={bodyType}
        onChange={(e) => setBodyType(e.target.value as typeof bodyType)}
        options={[
          { label: "Sedan", value: "SEDAN" },
          { label: "SUV", value: "SUV" },
          { label: "Hatchback", value: "HATCHBACK" },
        ]}
        disabled={saving}
      />

      <Select
        label="Fuel Type"
        value={fuelType}
        onChange={(e) => setFuelType(e.target.value as typeof fuelType)}
        options={[
          { label: "Petrol", value: "PETROL" },
          { label: "Diesel", value: "DIESEL" },
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

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button type="submit" loading={saving} disabled={saving}>
          Save Vehicle
        </Button>
      </div>
    </form>
  );
}