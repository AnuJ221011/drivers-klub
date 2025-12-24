import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Driver } from "../../utils/index";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { updateDriverAvailability, updateDriverDetails, updateDriverStatus } from '../../api/driver.api';

type Props = {
  driver: Driver | null;
  onClose?: () => void;
  onUpdated?: () => void;
};

export default function DriverDrawer({ driver, onClose, onUpdated }: Props) {
  if (!driver) return null;

  // capture the non-null id to avoid nullability issues in closures
  const driverId = driver.id;

  const [name, setName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [status, setStatus] = useState<'Active' | 'Inactive'>(driver.isActive ? 'Active' : 'Inactive');
  const [availability, setAvailability] = useState<'Available' | 'Unavailable'>(
    driver.isAvailable ? 'Available' : 'Unavailable',
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(driver.name);
    setPhone(driver.phone);
    setStatus(driver.isActive ? 'Active' : 'Inactive');
    setAvailability(driver.isAvailable ? 'Available' : 'Unavailable');
  }, [driver]);

  async function onSave() {
    setSaving(true);
    try {
      await updateDriverDetails(driverId, { name: name.trim(), phone: phone.trim() });
      await updateDriverStatus(driverId, status === 'Active');
      await updateDriverAvailability(driverId, availability === 'Available');
      toast.success('Driver updated');
      onUpdated?.();
      onClose?.();
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === 'object' && 'message' in data
          ? String((data as Record<string, unknown>).message)
          : 'Failed to update driver';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        label="Driver Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
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

      <Select
        label="Availability"
        value={availability}
        onChange={(e) => setAvailability(e.target.value as typeof availability)}
        options={[
          { label: "Available", value: "Available" },
          { label: "Unavailable", value: "Unavailable" },
        ]}
        disabled={saving}
      />

      <Button className="w-full" onClick={() => void onSave()} disabled={saving} loading={saving}>
        Save Changes
      </Button>
    </div>
  );
}