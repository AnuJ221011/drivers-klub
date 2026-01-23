// import { useState, type FormEvent } from 'react';
// import toast from 'react-hot-toast';

// import Input from "../ui/Input";
// import Select from "../ui/Select";
// import Button from "../ui/Button";
// import PhoneInput from "../ui/PhoneInput";

// import { createDriver } from '../../api/driver.api';
// import { useFleet } from '../../context/FleetContext';

// function getErrorMessage(err: unknown, fallback: string): string {
//   if (err && typeof err === 'object') {
//     const maybeAny = err as { response?: { data?: unknown } };
//     const data = maybeAny.response?.data;
//     if (data && typeof data === 'object' && 'message' in data) {
//       return String((data as Record<string, unknown>).message);
//     }
//   }
//   return fallback;
// }

// type Props = {
//   onClose: () => void;
//   onCreated?: () => void;
// };

// export default function AddDriver({ onClose, onCreated }: Props) {
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState(''); // store digits only
//   const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
//   const [saving, setSaving] = useState(false);
//   const { effectiveFleetId } = useFleet();

//   async function onSubmit(e: FormEvent) {
//     e.preventDefault();
//     if (!name.trim()) return toast.error('Please enter driver name');
//     if (!phone.trim()) return toast.error('Please enter phone number');
//     if (phone.replace(/\D/g, '').length !== 10) return toast.error('Phone number must be 10 digits');
//     if (!effectiveFleetId) return toast.error('No fleet selected/available');

//     setSaving(true);
//     try {
//       await createDriver({
//         name: name.trim(),
//         phone: phone.replace(/\D/g, '').slice(0, 10),
//         isActive: status === 'Active',
//         fleetId: effectiveFleetId,
//       });
//       toast.success('Driver created');
//       onCreated?.();
//       onClose();
//     } catch (err: unknown) {
//       toast.error(getErrorMessage(err, 'Failed to create driver'));
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <form className="space-y-4" onSubmit={onSubmit}>
//       <Input
//         label="Driver Name"
//         placeholder="Enter name"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//         disabled={saving}
//       />
//       <PhoneInput
//         label="Phone Number"
//         value={phone}
//         onChange={setPhone}
//         disabled={saving}
//       />

//       <Select
//         label="Status"
//         value={status}
//         onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
//         options={[
//           { label: "Active", value: "Active" },
//           { label: "Inactive", value: "Inactive" },
//         ]}
//         disabled={saving}
//       />

//       <div className="flex justify-end gap-3 pt-4">
//         <Button variant="secondary" type="button" onClick={onClose}>
//           Cancel
//         </Button>
//         <Button type="submit" loading={saving} disabled={saving}>
//           Save Driver
//         </Button>
//       </div>
//     </form>
//   );
// }


import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import PhoneInput from "../ui/PhoneInput";

import { createDriver } from '../../api/driver.api';
import { getFleetHubs } from '../../api/fleetHub.api';
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

export default function AddDriver({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // store digits only
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);
  const { effectiveFleetId } = useFleet();
  const [identityLivePhoto, setIdentityLivePhoto] = useState<File | null>(null);
  const [aadhaarCardFile, setAadhaarCardFile] = useState<File | null>(null);
  const [panCardFile, setPanCardFile] = useState<File | null>(null);
  const [bankDetailsFile, setBankDetailsFile] = useState<File | null>(null);
  const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);
  const [hubId, setHubId] = useState('');
  const [hubOptions, setHubOptions] = useState<Array<{ label: string; value: string }>>([
    { label: 'Unassigned', value: '' },
  ]);

  useEffect(() => {
    if (!effectiveFleetId) {
      setHubOptions([{ label: 'Unassigned', value: '' }]);
      setHubId('');
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
        // keep default options
      }
    })();
    return () => {
      mounted = false;
    };
  }, [effectiveFleetId]);

  function formatFileName(file: File | null): string {
    return file ? file.name : 'No file selected';
  }

  function formatFileList(files: File[]): string {
    if (files.length === 0) return 'No files selected';
    return `${files.length} file(s): ${files.map((file) => file.name).join(', ')}`;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    const trimmedName = name.trim();
    if (!trimmedName) return toast.error('Driver name is required');
    if (!digits) return toast.error('Phone number is required');
    if (digits.length !== 10) return toast.error('Phone number must be 10 digits');
    if (!effectiveFleetId) return toast.error('No fleet selected/available');

    setSaving(true);
    try {
      const result = await createDriver({
        name: trimmedName,
        phone: digits,
        isActive: status === 'Active',
        fleetId: effectiveFleetId,
        hubId: hubId || undefined,
        identityLivePhoto: identityLivePhoto ?? undefined,
        aadhaarCardFile: aadhaarCardFile ?? undefined,
        panCardFile: panCardFile ?? undefined,
        bankDetailsFile: bankDetailsFile ?? undefined,
        additionalDocuments: additionalDocuments.length > 0 ? additionalDocuments : undefined,
      });
      toast.success('Driver created');
      if (hubId && !result.hubAssigned) {
        toast.error('Driver created but hub assignment failed');
      }
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
      <PhoneInput
        label="Phone Number"
        value={phone}
        onChange={setPhone}
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

      <Select
        label="Hub"
        value={hubId}
        onChange={(e) => setHubId(e.target.value)}
        options={hubOptions}
        disabled={saving || !effectiveFleetId}
      />

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">KYC Documents</div>
        <Input
          label="Aadhaar Card File"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setAadhaarCardFile(e.target.files?.[0] || null)}
          helperText={formatFileName(aadhaarCardFile)}
          disabled={saving}
        />
        <Input
          label="PAN Card File"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setPanCardFile(e.target.files?.[0] || null)}
          helperText={formatFileName(panCardFile)}
          disabled={saving}
        />
      </div>

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Identity Verification</div>
        <Input
          label="Identity Live Photo"
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e) => setIdentityLivePhoto(e.target.files?.[0] || null)}
          helperText={formatFileName(identityLivePhoto)}
          disabled={saving}
        />
      </div>

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Bank Details</div>
        <Input
          label="Bank Details File"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setBankDetailsFile(e.target.files?.[0] || null)}
          helperText={formatFileName(bankDetailsFile)}
          disabled={saving}
        />
      </div>

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Supporting Documents</div>
        <Input
          label="Additional Files"
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={(e) => setAdditionalDocuments(Array.from(e.target.files || []))}
          helperText={formatFileList(additionalDocuments)}
          disabled={saving}
        />
      </div>

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