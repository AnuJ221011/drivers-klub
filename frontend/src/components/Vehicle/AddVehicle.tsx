import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

import { createVehicle } from '../../api/vehicle.api';
import { addVehicleToHub, getFleetHubs } from '../../api/fleetHub.api';
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
  type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
  type Ownership = 'OWNED' | 'LEASED';

  const [fleetMobileNumber, setFleetMobileNumber] = useState('');
  const [number, setNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [ownership, setOwnership] = useState<Ownership | ''>('');
  const [ownerName, setOwnerName] = useState('');
  const [fuelType, setFuelType] = useState<FuelType | ''>('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [vinNumber, setVinNumber] = useState('');
  const [rcFrontImage, setRcFrontImage] = useState<File | null>(null);
  const [rcBackImage, setRcBackImage] = useState<File | null>(null);
  const [permitImage, setPermitImage] = useState<File | null>(null);
  const [permitExpiry, setPermitExpiry] = useState('');
  const [fitnessImage, setFitnessImage] = useState<File | null>(null);
  const [fitnessExpiry, setFitnessExpiry] = useState('');
  const [insuranceImage, setInsuranceImage] = useState<File | null>(null);
  const [insuranceStart, setInsuranceStart] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);
  const { effectiveFleetId } = useFleet();
  const [hubId, setHubId] = useState('');
  const [hubOptions, setHubOptions] = useState<Array<{ label: string; value: string }>>([
    { label: 'Unassigned', value: '' },
  ]);

  function formatFileName(file: File | null): string {
    return file ? file.name : 'No file selected';
  }

  useEffect(() => {
    if (!effectiveFleetId) {
      setHubOptions([{ label: 'Unassigned', value: '' }]);
      return;
    }
    let mounted = true;
    void (async () => {
      try {
        const hubs = await getFleetHubs(effectiveFleetId);
        if (!mounted) return;
        setHubOptions([
          { label: 'Unassigned', value: '' },
          ...(hubs || []).map((h) => ({
            label: h.address ? `${h.hubType} • ${h.address}` : String(h.hubType),
            value: h.id,
          })),
        ]);
      } catch {
        // best-effort: keep select usable with existing value
      }
    })();
    return () => {
      mounted = false;
    };
  }, [effectiveFleetId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedNumber = number.trim();
    const trimmedBrand = brand.trim();
    const trimmedModel = model.trim();

    if (!trimmedNumber) return toast.error('Please enter vehicle number');
    if (!trimmedBrand) return toast.error('Please enter vehicle name');
    if (!trimmedModel) return toast.error('Please enter vehicle model');
    if (!ownership) return toast.error('Please select ownership');
    if (!fuelType) return toast.error('Please select fuel type');
    if (!effectiveFleetId) return toast.error('No fleet selected/available');

    setSaving(true);
    try {
      const created = await createVehicle({
        number: trimmedNumber,
        brand: trimmedBrand,
        model: trimmedModel,
        vehicleColor: vehicleColor.trim() || undefined,
        ownerName: ownerName.trim() || undefined,
        ownership: ownership as Ownership,
        fuelType: fuelType as FuelType,
        chassisNumber: chassisNumber.trim() || undefined,
        vinNumber: vinNumber.trim() || undefined,
        rcFrontImage: rcFrontImage ?? undefined,
        rcBackImage: rcBackImage ?? undefined,
        permitImage: permitImage ?? undefined,
        permitExpiry: permitExpiry || undefined,
        fitnessImage: fitnessImage ?? undefined,
        fitnessExpiry: fitnessExpiry || undefined,
        insuranceImage: insuranceImage ?? undefined,
        insuranceStart: insuranceStart || undefined,
        insuranceExpiry: insuranceExpiry || undefined,
        fleetMobileNumber: fleetMobileNumber.trim() || undefined,
        isActive: status === 'Active',
        fleetId: effectiveFleetId,
      });
      if (hubId) {
        try {
          await addVehicleToHub(hubId, created.id);
        } catch {
          toast.error('Vehicle created, but failed to assign hub');
        }
      }
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
        label="Fleet Mobile Number"
        placeholder="Fleet mobile number"
        value={fleetMobileNumber}
        onChange={(e) => setFleetMobileNumber(e.target.value)}
        disabled={saving}
      />

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Basic Information</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Vehicle Number"
            placeholder="DL 01 AB 1234"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Vehicle Name"
            placeholder="Tata Tigor"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Vehicle Model"
            placeholder="XE"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Vehicle Color"
            placeholder="White"
            value={vehicleColor}
            onChange={(e) => setVehicleColor(e.target.value)}
            disabled={saving}
          />
          <Select
            label="Ownership"
            value={ownership}
            onChange={(e) => setOwnership(e.target.value as Ownership | '')}
            options={[
              { label: "Select ownership", value: "" },
              { label: "Owned", value: "OWNED" },
              { label: "Leased", value: "LEASED" },
            ]}
            disabled={saving}
          />
          <Input
            label="Owner Name"
            placeholder="Owner name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            disabled={saving}
          />
          <Select
            label="Fuel Type"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as FuelType | '')}
            options={[
              { label: "Select fuel type", value: "" },
              { label: "Petrol", value: "PETROL" },
              { label: "Diesel", value: "DIESEL" },
              { label: "CNG", value: "CNG" },
              { label: "EV", value: "EV" },
            ]}
            disabled={saving}
          />
          <Input
            label="Chassis Number"
            placeholder="MA1AB2CD3EF456789"
            value={chassisNumber}
            onChange={(e) => setChassisNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="VIN Number"
            placeholder="1HGBH41JXMN109186"
            value={vinNumber}
            onChange={(e) => setVinNumber(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Documents</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="RC Front Image"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setRcFrontImage(e.target.files?.[0] || null)}
            helperText={formatFileName(rcFrontImage)}
            disabled={saving}
          />
          <Input
            label="RC Back Image"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setRcBackImage(e.target.files?.[0] || null)}
            helperText={formatFileName(rcBackImage)}
            disabled={saving}
          />
          <Input
            label="Permit Image"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setPermitImage(e.target.files?.[0] || null)}
            helperText={formatFileName(permitImage)}
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
            label="Fitness Image"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFitnessImage(e.target.files?.[0] || null)}
            helperText={formatFileName(fitnessImage)}
            disabled={saving}
          />
          <Input
            label="Fitness Expiry Date"
            type="date"
            value={fitnessExpiry}
            onChange={(e) => setFitnessExpiry(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Insurance Image"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setInsuranceImage(e.target.files?.[0] || null)}
            helperText={formatFileName(insuranceImage)}
            disabled={saving}
          />
          <Input
            label="Insurance Start Date"
            type="date"
            value={insuranceStart}
            onChange={(e) => setInsuranceStart(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Insurance Expiry Date"
            type="date"
            value={insuranceExpiry}
            onChange={(e) => setInsuranceExpiry(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Status & Hub</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <Select
            label="Hub"
            value={hubId}
            onChange={(e) => setHubId(e.target.value)}
            options={hubOptions}
            disabled={saving || !effectiveFleetId}
          />
        </div>
      </div>

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