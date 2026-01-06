import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

import { createDriver } from '../../api/driver.api';
import { useFleet } from '../../context/FleetContext';
import { getPhoneDigitsRemainingHint } from '../../utils/phoneHint';

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

export default function AddDriver({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);
  const { effectiveFleetId } = useFleet();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter driver name');
    if (!phone.trim()) return toast.error('Please enter phone number');
    if (!effectiveFleetId) return toast.error('No fleet selected/available');

    setSaving(true);
    try {
      await createDriver({
        name: name.trim(),
        phone: phone.trim(),
        isActive: status === 'Active',
        fleetId: effectiveFleetId,
      });
      toast.success('Driver created');
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create driver'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Input
        label="Driver Name"
        placeholder="Enter name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
      />
      <Input
        label="Phone Number"
        placeholder="Enter phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
        inputMode="numeric"
        maxLength={10}
        helperText={getPhoneDigitsRemainingHint(phone)}
        disabled={saving}
      />

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
        disabled={saving}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={saving}>
          Save Driver
        </Button>
      </div>
    </form>
  );
}