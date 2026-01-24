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

function splitDriverName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export default function DriverDrawer({ driver, fleetId, onClose, onUpdated }: Props) {
  type PaymentModel = 'RENTAL' | 'PAYOUT';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(''); // digits only
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [paymentModel, setPaymentModel] = useState<PaymentModel | ''>('');
  const [depositBalance, setDepositBalance] = useState('');
  const [revSharePercentage, setRevSharePercentage] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [hubId, setHubId] = useState<string>(''); // '' => unassigned
  const [hubOptions, setHubOptions] = useState<Array<{ label: string; value: string }>>([
    { label: 'Unassigned', value: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [licenseFront, setLicenseFront] = useState<File | null>(null);
  const [licenseBack, setLicenseBack] = useState<File | null>(null);
  const [aadharFront, setAadharFront] = useState<File | null>(null);
  const [aadharBack, setAadharBack] = useState<File | null>(null);
  const [panCardImage, setPanCardImage] = useState<File | null>(null);
  const [livePhoto, setLivePhoto] = useState<File | null>(null);
  const [bankIdProof, setBankIdProof] = useState<File | null>(null);
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
    const split = splitDriverName(driver.name);
    setFirstName(split.firstName);
    setLastName(split.lastName);
    setPhone(driver.phone);
    setStatus(driver.isActive ? 'Active' : 'Inactive');
    setHubId(driver.hubId || '');
    setEmail('');
    setDob('');
    setProfilePic('');
    setAddress('');
    setCity('');
    setPincode('');
    setAadharNumber('');
    setPanNumber('');
    setDlNumber('');
    setLicenseNumber('');
    setGstNumber('');
    setPaymentModel('');
    setDepositBalance('');
    setRevSharePercentage('');
    setBankAccountNumber('');
    setBankIfscCode('');
    setBankAccountName('');
    setLicenseFront(null);
    setLicenseBack(null);
    setAadharFront(null);
    setAadharBack(null);
    setPanCardImage(null);
    setLivePhoto(null);
    setBankIdProof(null);
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
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    if (!trimmedFirstName) return toast.error('First name is required');
    if (digits.length !== 10) return toast.error('Phone number must be 10 digits');
    const depositValue = depositBalance.trim();
    const revShareValue = revSharePercentage.trim();
    const depositParsed = depositValue ? Number(depositValue) : undefined;
    const revShareParsed = revShareValue ? Number(revShareValue) : undefined;
    if (depositValue && Number.isNaN(depositParsed)) {
      return toast.error('Deposit balance must be a number');
    }
    if (revShareValue && Number.isNaN(revShareParsed)) {
      return toast.error('Revenue share must be a number');
    }
    setSaving(true);
    try {
      await updateDriverDetails(driverId, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName || undefined,
        phone: digits,
        email: email.trim() || undefined,
        dob: dob || undefined,
        profilePic: profilePic.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        aadharNumber: aadharNumber.trim() || undefined,
        panNumber: panNumber.trim() || undefined,
        dlNumber: dlNumber.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        paymentModel: paymentModel || undefined,
        depositBalance: depositParsed,
        revSharePercentage: revShareParsed,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankIfscCode: bankIfscCode.trim() || undefined,
        bankAccountName: bankAccountName.trim() || undefined,
        licenseFront: licenseFront ?? undefined,
        licenseBack: licenseBack ?? undefined,
        aadharFront: aadharFront ?? undefined,
        aadharBack: aadharBack ?? undefined,
        panCardImage: panCardImage ?? undefined,
        livePhoto: livePhoto ?? undefined,
        bankIdProof: bankIdProof ?? undefined,
        additionalDocuments: additionalDocuments.length > 0 ? additionalDocuments : undefined,
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
      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Basic Information</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Last Name (optional)"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={saving}
          />
          <PhoneInput
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            disabled
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Profile Picture URL"
            placeholder="https://..."
            value={profilePic}
            onChange={(e) => setProfilePic(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Address</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Input
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
            />
          </div>
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">KYC Numbers</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Aadhaar Number"
            value={aadharNumber}
            onChange={(e) => setAadharNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="PAN Number"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="DL Number"
            value={dlNumber}
            onChange={(e) => setDlNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="License Number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="GST Number"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Payment & Bank</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Payment Model"
            value={paymentModel}
            onChange={(e) => setPaymentModel(e.target.value as PaymentModel | '')}
            options={[
              { label: 'Select model', value: '' },
              { label: 'Rental', value: 'RENTAL' },
              { label: 'Payout', value: 'PAYOUT' },
            ]}
            disabled={saving}
          />
          <Input
            label="Deposit Balance"
            type="number"
            step="0.01"
            value={depositBalance}
            onChange={(e) => setDepositBalance(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Revenue Share %"
            type="number"
            step="0.01"
            value={revSharePercentage}
            onChange={(e) => setRevSharePercentage(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Bank Account Number"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Bank IFSC Code"
            value={bankIfscCode}
            onChange={(e) => setBankIfscCode(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Bank Account Name"
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
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
            disabled={saving || !fleetId}
          />
        </div>
        <div className="text-xs text-black/60">
          Availability is managed by the system (attendance/trips).
        </div>
      </div>

      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">KYC Attachments</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="License Front"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setLicenseFront(e.target.files?.[0] || null)}
            helperText={formatFileName(licenseFront)}
            disabled={saving}
          />
          <Input
            label="License Back"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setLicenseBack(e.target.files?.[0] || null)}
            helperText={formatFileName(licenseBack)}
            disabled={saving}
          />
          <Input
            label="Aadhaar Front"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setAadharFront(e.target.files?.[0] || null)}
            helperText={formatFileName(aadharFront)}
            disabled={saving}
          />
          <Input
            label="Aadhaar Back"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setAadharBack(e.target.files?.[0] || null)}
            helperText={formatFileName(aadharBack)}
            disabled={saving}
          />
          <Input
            label="PAN Card Image"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setPanCardImage(e.target.files?.[0] || null)}
            helperText={formatFileName(panCardImage)}
            disabled={saving}
          />
          <Input
            label="Bank ID Proof"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setBankIdProof(e.target.files?.[0] || null)}
            helperText={formatFileName(bankIdProof)}
            disabled={saving}
          />
          <Input
            label="Live Photo"
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => setLivePhoto(e.target.files?.[0] || null)}
            helperText={formatFileName(livePhoto)}
            disabled={saving}
          />
        </div>
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