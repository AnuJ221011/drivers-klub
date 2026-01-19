// import { useEffect, useState } from 'react';
// import toast from 'react-hot-toast';
// import type { Driver } from "../../utils/index";
// import Input from "../ui/Input";
// import Select from "../ui/Select";
// import Button from "../ui/Button";
// import { updateDriverDetails, updateDriverStatus } from '../../api/driver.api';
// import PhoneInput from "../ui/PhoneInput";
// import { addDriverToHub, getFleetHubs, removeDriverFromHub } from '../../api/fleetHub.api';

// type Props = {
//   driver: Driver | null;
//   fleetId: string;
//   onClose?: () => void;
//   onUpdated?: () => void;
// };

// export default function DriverDrawer({ driver, fleetId, onClose, onUpdated }: Props) {
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState(''); // digits only
//   const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
//   const [hubId, setHubId] = useState<string>(''); // '' => unassigned
//   const [hubOptions, setHubOptions] = useState<Array<{ label: string; value: string }>>([
//     { label: 'Unassigned', value: '' },
//   ]);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (!driver) return;
//     setName(driver.name);
//     setPhone(driver.phone);
//     setStatus(driver.isActive ? 'Active' : 'Inactive');
//     setHubId(driver.hubId || '');
//   }, [driver]);

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
//         // best-effort: keep select usable with existing value
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [fleetId]);

//   async function onSave() {
//     if (!driver) return;
//     // capture the non-null id to avoid nullability issues in closures
//     const driverId = driver.id;
//     const prevHubId = driver.hubId || '';
//     const digits = phone.replace(/\D/g, '');
//     if (digits.length !== 10) return toast.error('Phone number must be 10 digits');
//     setSaving(true);
//     try {
//       await updateDriverDetails(driverId, { name: name.trim()});
//       await updateDriverStatus(driverId, status === 'Active');

//       // Hub assignment (new):
//       // - If hubId becomes empty => remove from previous hub
//       // - If hubId is set => add to hub (backend updates driver.hubId)
//       if (hubId !== prevHubId) {
//         if (!hubId && prevHubId) {
//           await removeDriverFromHub(prevHubId, driverId);
//         } else if (hubId) {
//           await addDriverToHub(hubId, driverId);
//         }
//       }

//       toast.success('Driver updated');
//       onUpdated?.();
//       onClose?.();
//     } catch (err: unknown) {
//       const maybeAny = err as { response?: { data?: unknown } };
//       const data = maybeAny.response?.data;
//       const msg =
//         data && typeof data === 'object' && 'message' in data
//           ? String((data as Record<string, unknown>).message)
//           : 'Failed to update driver';
//       toast.error(msg);
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (!driver) return null;

//   return (
//     <div className="space-y-4">
//       <Input
//         label="Driver Name"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//         disabled={saving}
//       />

//       <PhoneInput
//         label="Phone Number"
//         value={phone}
//         onChange={setPhone}
//         disabled
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

//       <div className="text-xs text-black/60">
//         Availability is managed by the system (attendance/trips).
//       </div>

//       <Button className="w-full" onClick={() => void onSave()} disabled={saving} loading={saving}>
//         Save Changes
//       </Button>
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Driver } from "../../utils/index";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { updateDriverDetails, updateDriverStatus } from '../../api/driver.api';
import PhoneInput from "../ui/PhoneInput";
import { addDriverToHub, getFleetHubs, removeDriverFromHub } from '../../api/fleetHub.api';

type Props = {
  driver: Driver | null;
  fleetId: string;
  onClose?: () => void;
  onUpdated?: () => void;
};

export default function DriverDrawer({ driver, fleetId, onClose, onUpdated }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // digits only
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [hubId, setHubId] = useState<string>(''); // '' => unassigned
  const [hubOptions, setHubOptions] = useState<Array<{ label: string; value: string }>>([
    { label: 'Unassigned', value: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [identityLivePhoto, setIdentityLivePhoto] = useState<File | null>(null);
  const [aadhaarCardFile, setAadhaarCardFile] = useState<File | null>(null);
  const [panCardFile, setPanCardFile] = useState<File | null>(null);
  const [bankDetailsFile, setBankDetailsFile] = useState<File | null>(null);
  const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);

  function formatFileName(file: File | null): string {
    return file ? file.name : 'No file selected';
  }

  function formatFileList(files: File[]): string {
    if (files.length === 0) return 'No files selected';
    return `${files.length} file(s): ${files.map((file) => file.name).join(', ')}`;
  }

  useEffect(() => {
    if (!driver) return;
    setName(driver.name);
    setPhone(driver.phone);
    setStatus(driver.isActive ? 'Active' : 'Inactive');
    setHubId(driver.hubId || '');
    setIdentityLivePhoto(null);
    setAadhaarCardFile(null);
    setPanCardFile(null);
    setBankDetailsFile(null);
    setAdditionalDocuments([]);
  }, [driver]);

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
  }, [fleetId]);

  async function onSave() {
    if (!driver) return;
    // capture the non-null id to avoid nullability issues in closures
    const driverId = driver.id;
    const prevHubId = driver.hubId || '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) return toast.error('Phone number must be 10 digits');
    setSaving(true);
    try {
      await updateDriverDetails(driverId, {
        name: name.trim(),
        phone: digits,
      });
      await updateDriverStatus(driverId, status === 'Active');

      // Hub assignment (new):
      // - If hubId becomes empty => remove from previous hub
      // - If hubId is set => add to hub (backend updates driver.hubId)
      if (hubId !== prevHubId) {
        if (!hubId && prevHubId) {
          await removeDriverFromHub(prevHubId, driverId);
        } else if (hubId) {
          await addDriverToHub(hubId, driverId);
        }
      }

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

  if (!driver) return null;

  return (
    <div className="space-y-4">
      <Input
        label="Driver Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
      />

      <PhoneInput
        label="Phone Number"
        value={phone}
        onChange={setPhone}
        disabled
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
        label="Hub"
        value={hubId}
        onChange={(e) => setHubId(e.target.value)}
        options={hubOptions}
        disabled={saving || !fleetId}
      />

      <div className="text-xs text-black/60">
        Availability is managed by the system (attendance/trips).
      </div>

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

      <Button className="w-full" onClick={() => void onSave()} disabled={saving} loading={saving}>
        Save Changes
      </Button>
    </div>
  );
}