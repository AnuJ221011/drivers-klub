import { useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { createFleet, type CreateFleetInput } from '../../api/fleet.api';

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
  onCreated?: (fleetId: string) => void;
};

export default function AddFleet({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [fleetType, setFleetType] = useState<CreateFleetInput['fleetType']>('COMPANY');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [modeId, setModeId] = useState('CAB');
  const [saving, setSaving] = useState(false);

  const fleetTypeOptions = useMemo(
    () => [
      { label: 'Company', value: 'COMPANY' },
      { label: 'Individual', value: 'INDIVIDUAL' },
    ],
    [],
  );

  const modeOptions = useMemo(
    () => [
      { label: 'CAB', value: 'CAB' },
      { label: 'BIKE', value: 'BIKE' },
    ],
    [],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter fleet name');
    if (!mobile.trim()) return toast.error('Please enter mobile number');
    if (!city.trim()) return toast.error('Please enter city');
    if (!panNumber.trim()) return toast.error('Please enter PAN number');
    if (!modeId.trim()) return toast.error('Please select mode');

    const payload: CreateFleetInput = {
      name: name.trim(),
      mobile: mobile.trim(),
      city: city.trim(),
      panNumber: panNumber.trim(),
      modeId: modeId.trim(),
      fleetType,
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(gstNumber.trim() ? { gstNumber: gstNumber.trim() } : {}),
      ...(dob ? { dob } : {}),
    };

    setSaving(true);
    try {
      const created = await createFleet(payload);
      toast.success('Fleet created');
      onCreated?.(created.id);
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create fleet'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <Input
        label="Fleet Name"
        placeholder="Sharma Travels"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Mobile"
        placeholder="9999999999"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Email (optional)"
        placeholder="fleet@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={saving}
      />

      <Input
        label="City"
        placeholder="Delhi"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        disabled={saving}
      />

      <Input
        label="DOB (optional)"
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        disabled={saving}
      />

      <Select
        label="Fleet Type"
        value={fleetType}
        onChange={(e) => setFleetType(e.target.value as CreateFleetInput['fleetType'])}
        options={fleetTypeOptions}
        disabled={saving}
      />

      <Input
        label="GST Number (optional)"
        placeholder="22AAAAA0000A1Z5"
        value={gstNumber}
        onChange={(e) => setGstNumber(e.target.value)}
        disabled={saving}
      />

      <Input
        label="PAN Number"
        placeholder="ABCDE1234F"
        value={panNumber}
        onChange={(e) => setPanNumber(e.target.value)}
        disabled={saving}
      />

      <Select
        label="Mode"
        value={modeId}
        onChange={(e) => setModeId(e.target.value)}
        options={modeOptions}
        disabled={saving}
      />

      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={saving}>
          Save Fleet
        </Button>
      </div>
    </form>
  );
}

