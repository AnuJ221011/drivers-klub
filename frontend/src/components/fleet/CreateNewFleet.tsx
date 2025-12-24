import { useState } from "react";
import toast from "react-hot-toast";

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

type FleetForm = {
  name: string;
  mobile: string;
  email: string;
  city: string;
  dob: string;
  fleetType: string;
  gstNumber: string;
  panNumber: string;
  modeId: string;
};

export default function CreateNewFleet({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FleetForm>({
    name: "",
    mobile: "",
    email: "",
    city: "",
    dob: "",
    fleetType: "",
    gstNumber: "",
    panNumber: "",
    modeId: "",
  });

  const handleChange = <K extends keyof FleetForm>(
    key: K,
    value: FleetForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.mobile || !form.city || !form.fleetType || !form.panNumber || !form.modeId) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      // 🔹 Replace with real API later
      await new Promise((r) => setTimeout(r, 800));

      toast.success("Fleet onboarded successfully");
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error("Failed to onboard fleet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      <Input
        label="Fleet Owner Name *"
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />

      <Input
        label="Mobile Number *"
        value={form.mobile}
        onChange={(e) => handleChange("mobile", e.target.value)}
        placeholder="10 digit mobile number"
      />

      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
      />

      <Input
        label="City *"
        value={form.city}
        onChange={(e) => handleChange("city", e.target.value)}
      />

      <Input
        label="Date of Birth"
        type="date"
        value={form.dob}
        onChange={(e) => handleChange("dob", e.target.value)}
      />

      <Select
        label="Fleet Type *"
        value={form.fleetType}
        onChange={(e) => handleChange("fleetType", e.target.value)}
        options={[
          { label: "Select Type", value: "" },
          { label: "Individual", value: "INDIVIDUAL" },
          { label: "Company", value: "COMPANY" },
          { label: "Partnership", value: "PARTNERSHIP" },
        ]}
      />

      <Input
        label="GST Number"
        value={form.gstNumber}
        onChange={(e) => handleChange("gstNumber", e.target.value)}
      />

      <Input
        label="PAN Number *"
        value={form.panNumber}
        onChange={(e) => handleChange("panNumber", e.target.value)}
      />

      <Input
        label="Mode ID *"
        value={form.modeId}
        onChange={(e) => handleChange("modeId", e.target.value)}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button loading={loading} onClick={handleSubmit}>
          Onboard Fleet
        </Button>
      </div>
    </div>
  );
}