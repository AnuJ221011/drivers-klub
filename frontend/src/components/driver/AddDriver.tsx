import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import PhoneInput from "../ui/PhoneInput";

import { createDriver, getDriverUploadUrl } from '../../api/driver.api';
import { addDriverToHub, getFleetHubs } from '../../api/fleetHub.api';
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
  type PaymentModel = 'RENTAL' | 'PAYOUT';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(''); // store digits only
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
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
  const [saving, setSaving] = useState(false);
  const { effectiveFleetId } = useFleet();
  const [hubId, setHubId] = useState('');
  const [hubOptions, setHubOptions] = useState<Array<{ label: string; value: string }>>([
    { label: 'Unassigned', value: '' },
  ]);
  const [licenseFront, setLicenseFront] = useState<File | null>(null);
  const [licenseBack, setLicenseBack] = useState<File | null>(null);
  const [aadharFront, setAadharFront] = useState<File | null>(null);
  const [aadharBack, setAadharBack] = useState<File | null>(null);
  const [panCardImage, setPanCardImage] = useState<File | null>(null);
  const [livePhoto, setLivePhoto] = useState<File | null>(null);
  const [bankIdProof, setBankIdProof] = useState<File | null>(null);
  const [currentAddressProof, setCurrentAddressProof] = useState<File | null>(null);
  const [permanentAddressProof, setPermanentAddressProof] = useState<File | null>(null);
  const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);

  function formatFileName(file: File | null): string {
    return file ? file.name : 'No file selected';
  }

  function formatFileList(files: File[]): string {
    if (files.length === 0) return 'No files selected';
    return `${files.length} file(s): ${files.map((file) => file.name).join(', ')}`;
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

  async function uploadProfilePicture(file: File): Promise<string> {
    const inferredType = file.type && file.type.includes('/') ? file.type.split('/')[1] : '';
    const fallbackType = file.name.split('.').pop() || 'jpeg';
    const fileType = inferredType || fallbackType;
    const { uploadUrl, url } = await getDriverUploadUrl('profiles', fileType);
    const contentType = file.type || `image/${fileType}`;
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!res.ok) {
      throw new Error('Failed to upload profile picture');
    }
    return url;
  }

  async function uploadDriverDocument(file: File): Promise<string> {
    const inferredType = file.type && file.type.includes('/') ? file.type.split('/')[1] : '';
    const fallbackType = file.name.split('.').pop() || 'jpeg';
    const fileType = inferredType || fallbackType;
    const { uploadUrl, url } = await getDriverUploadUrl('documents', fileType);
    const contentType = file.type || `image/${fileType}`;
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!res.ok) {
      throw new Error('Failed to upload document');
    }
    return url;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    if (!trimmedFirstName) return toast.error('First name is required');
    if (!digits) return toast.error('Phone number is required');
    if (digits.length !== 10) return toast.error('Phone number must be 10 digits');
    if (!effectiveFleetId) return toast.error('No fleet selected/available');
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
      const [profilePicUrl, currentAddressProofUrl, permanentAddressProofUrl] = await Promise.all([
        profilePicFile ? uploadProfilePicture(profilePicFile) : Promise.resolve(undefined),
        currentAddressProof ? uploadDriverDocument(currentAddressProof) : Promise.resolve(undefined),
        permanentAddressProof ? uploadDriverDocument(permanentAddressProof) : Promise.resolve(undefined),
      ]);
      const created = await createDriver({
        firstName: trimmedFirstName,
        lastName: trimmedLastName || undefined,
        phone: digits,
        isActive: status === 'Active',
        fleetId: effectiveFleetId,
        email: email.trim() || undefined,
        dob: dob || undefined,
        profilePic: profilePicUrl,
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
        currentAddressProof: currentAddressProofUrl,
        permanentAddressProof: permanentAddressProofUrl,
        additionalDocuments: additionalDocuments.length > 0 ? additionalDocuments : undefined,
      });
      if (hubId) {
        try {
          await addDriverToHub(hubId, created.id);
        } catch {
          toast.error('Driver created, but failed to assign hub');
        }
      }
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
    <form
      className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
      onSubmit={onSubmit}
    >
      <div className="rounded-md border border-black/10 p-3 space-y-3">
        <div className="text-sm font-semibold text-black">Basic Information</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="First Name"
            placeholder="Enter first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Last Name (optional)"
            placeholder="Enter last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={saving}
          />
          <PhoneInput
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            disabled={saving}
          />
          <Input
            label="Email"
            type="email"
            placeholder="driver@example.com"
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
            label="Profile Picture"
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePicFile(e.target.files?.[0] || null)}
            helperText={formatFileName(profilePicFile)}
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
              placeholder="House no, street"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
            />
          </div>
          <Input
            label="City"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Pincode"
            placeholder="110001"
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
            placeholder="1234 5678 9012"
            value={aadharNumber}
            onChange={(e) => setAadharNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="PAN Number"
            placeholder="ABCDE1234F"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="DL Number"
            placeholder="DL-12345-67890"
            value={dlNumber}
            onChange={(e) => setDlNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="License Number"
            placeholder="DL-12345-67890"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            disabled={saving}
          />
          <Input
            label="GST Number"
            placeholder="22AAAAA0000A1Z5"
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
            label="Current Address Proof"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setCurrentAddressProof(e.target.files?.[0] || null)}
            helperText={formatFileName(currentAddressProof)}
            disabled={saving}
          />
          <Input
            label="Permanent Address Proof"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setPermanentAddressProof(e.target.files?.[0] || null)}
            helperText={formatFileName(permanentAddressProof)}
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