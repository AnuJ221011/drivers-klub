// import { useState } from "react";
// import toast from "react-hot-toast";

// import Input from "../ui/Input";
// import Select from "../ui/Select";
// import Button from "../ui/Button";
// import { createFleet } from "../../api/fleet.api";
// import type { FleetType } from "../../models/fleet/fleet";

// type Props = {
//   onClose: () => void;
//   onCreated?: () => void;
// };

// type FleetForm = {
//   name: string;
//   mobile: string;
//   email: string;
//   city: string;
//   dob: string;
//   fleetType: FleetType | "";
//   gstNumber: string;
//   panNumber: string;
//   modeId: string;
// };

// export default function CreateNewFleet({ onClose, onCreated }: Props) {
//   const [loading, setLoading] = useState(false);

//   const [form, setForm] = useState<FleetForm>({
//     name: "",
//     mobile: "",
//     email: "",
//     city: "",
//     dob: "",
//     fleetType: "",
//     gstNumber: "",
//     panNumber: "",
//     modeId: "",
//   });

//   function getErrorMessage(err: unknown, fallback: string): string {
//     if (err && typeof err === "object") {
//       const maybeAny = err as { response?: { data?: unknown } };
//       const data = maybeAny.response?.data;
//       if (data && typeof data === "object" && "message" in data) {
//         return String((data as Record<string, unknown>).message);
//       }
//     }
//     return fallback;
//   }

//   const handleChange = <K extends keyof FleetForm>(
//     key: K,
//     value: FleetForm[K]
//   ) => {
//     setForm((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleSubmit = async () => {
//     if (!form.name || !form.mobile || !form.city || !form.fleetType || !form.panNumber || !form.modeId) {
//       toast.error("Please fill all required fields");
//       return;
//     }

//     try {
//       setLoading(true);

//       await createFleet({
//         name: form.name.trim(),
//         mobile: form.mobile.trim(),
//         city: form.city.trim(),
//         fleetType: form.fleetType,
//         panNumber: form.panNumber.trim(),
//         modeId: form.modeId.trim(),
//         email: form.email.trim() ? form.email.trim() : undefined,
//         gstNumber: form.gstNumber.trim() ? form.gstNumber.trim() : undefined,
//         dob: form.dob ? form.dob : undefined,
//       });

//       toast.success("Fleet onboarded successfully");
//       onCreated?.();
//       onClose();
//     } catch (err) {
//       toast.error(getErrorMessage(err, "Failed to onboard fleet"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
//       <Input
//         label="Fleet Owner Name *"
//         value={form.name}
//         onChange={(e) => handleChange("name", e.target.value)}
//       />

//       <Input
//         label="Mobile Number *"
//         value={form.mobile}
//         onChange={(e) => handleChange("mobile", e.target.value)}
//         placeholder="10 digit mobile number"
//       />

//       <Input
//         label="Email"
//         type="email"
//         value={form.email}
//         onChange={(e) => handleChange("email", e.target.value)}
//       />

//       <Input
//         label="City *"
//         value={form.city}
//         onChange={(e) => handleChange("city", e.target.value)}
//       />

//       <Input
//         label="Date of Birth"
//         type="date"
//         value={form.dob}
//         onChange={(e) => handleChange("dob", e.target.value)}
//       />

//       <Select
//         label="Fleet Type *"
//         value={form.fleetType}
//         onChange={(e) => handleChange("fleetType", e.target.value as FleetType | "")}
//         options={[
//           { label: "Select Type", value: "" },
//           { label: "Individual", value: "INDIVIDUAL" },
//           { label: "Company", value: "COMPANY" },
//         ]}
//       />

//       <Input
//         label="GST Number"
//         value={form.gstNumber}
//         onChange={(e) => handleChange("gstNumber", e.target.value)}
//       />

//       <Input
//         label="PAN Number *"
//         value={form.panNumber}
//         onChange={(e) => handleChange("panNumber", e.target.value)}
//       />

//       <Input
//         label="Mode ID *"
//         value={form.modeId}
//         onChange={(e) => handleChange("modeId", e.target.value)}
//       />

//       <div className="flex justify-end gap-3 pt-2">
//         <Button variant="secondary" onClick={onClose}>
//           Cancel
//         </Button>

//         <Button loading={loading} onClick={handleSubmit}>
//           Onboard Fleet
//         </Button>
//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import toast from "react-hot-toast";

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { createFleet } from "../../api/fleet.api";
import type { FleetType } from "../../models/fleet/fleet";

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

type FleetForm = {
  name: string;
  fleetAdminName: string;
  mobile: string;
  email: string;
  city: string;
  dob: string;
  fleetType: FleetType | "";
  gstNumber: string;
  panNumber: string;
};

export default function CreateNewFleet({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [panCardFile, setPanCardFile] = useState<File | null>(null);

  const [form, setForm] = useState<FleetForm>({
    name: "",
    fleetAdminName: "",
    mobile: "",
    email: "",
    city: "",
    dob: "",
    fleetType: "",
    gstNumber: "",
    panNumber: "",
  });

  function formatFileName(file: File | null): string {
    return file ? file.name : "No file selected";
  }

  function getErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === "object") {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      if (data && typeof data === "object" && "message" in data) {
        return String((data as Record<string, unknown>).message);
      }
    }
    return fallback;
  }

  const handleChange = <K extends keyof FleetForm>(
    key: K,
    value: FleetForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const trimmedAdminName = form.fleetAdminName.trim();
    const trimmedMobile = form.mobile.trim();
    const trimmedCity = form.city.trim();
    const trimmedPan = form.panNumber.trim();

    if (
      !trimmedName ||
      !trimmedAdminName ||
      !trimmedMobile ||
      !trimmedCity ||
      !form.fleetType ||
      !trimmedPan
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      await createFleet({
        name: trimmedName,
        fleetAdminName: trimmedAdminName,
        mobile: trimmedMobile,
        city: trimmedCity,
        fleetType: form.fleetType,
        panNumber: trimmedPan,
        email: form.email.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
        dob: form.dob || undefined,
        panCardFile: panCardFile ?? undefined,
      });

      toast.success("Fleet onboarded successfully");
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to onboard fleet"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Fleet Name"
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />

      <Input
        label="Fleet Admin Name"
        value={form.fleetAdminName}
        onChange={(e) => handleChange("fleetAdminName", e.target.value)}
      />

      <Input
        label="Mobile Number"
        value={form.mobile}
        onChange={(e) => handleChange("mobile", e.target.value)}
        placeholder="10 digit mobile number"
        helperText="This mobile number will be used for Fleet Admin login."
      />

      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
      />

      <Input
        label="City"
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
        label="Fleet Type"
        value={form.fleetType}
        onChange={(e) => handleChange("fleetType", e.target.value as FleetType | "")}
        options={[
          { label: "Select Type", value: "" },
          { label: "Individual", value: "INDIVIDUAL" },
          { label: "Company", value: "COMPANY" },
        ]}
      />

      <Input
        label="GST Number"
        value={form.gstNumber}
        onChange={(e) => handleChange("gstNumber", e.target.value)}
      />

      <Input
        label="PAN Number"
        value={form.panNumber}
        onChange={(e) => handleChange("panNumber", e.target.value)}
      />
      <Input
        label="PAN Card File"
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setPanCardFile(e.target.files?.[0] || null)}
        helperText={formatFileName(panCardFile)}
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