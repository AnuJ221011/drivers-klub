import { useEffect, useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

/**
 * Local Fleet type (kept inside file as you prefer)
 */
export type Fleet = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  city: string;
  dob?: string;
  fleetType: "INDIVIDUAL" | "COMPANY" | "PARTNERSHIP";
  gstNumber?: string;
  panNumber: string;
  modeId: string;
  status?: "Active" | "Inactive";
};

type Props = {
  fleet: Fleet | null;
  onSave?: (updated: Fleet) => void;
};

export default function FleetDrawer({ fleet, onSave }: Props) {
  const [form, setForm] = useState<Fleet | null>(null);

  useEffect(() => {
    setForm(fleet);
  }, [fleet]);

  if (!form) return null;

  const handleChange = <K extends keyof Fleet>(
    key: K,
    value: Fleet[K]
  ) => {
    setForm((prev) =>
      prev ? { ...prev, [key]: value } : prev
    );
  };

  const handleSave = () => {
    onSave?.(form);
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      {/* Fleet Owner */}
      <Input
        label="Fleet Owner Name"
        value={form.name}
        onChange={(e) =>
          handleChange("name", e.target.value)
        }
      />

      <Input
        label="Mobile Number"
        value={form.mobile}
        onChange={(e) =>
          handleChange("mobile", e.target.value)
        }
      />

      <Input
        label="Email"
        value={form.email || ""}
        onChange={(e) =>
          handleChange("email", e.target.value)
        }
      />

      <Input
        label="City"
        value={form.city}
        onChange={(e) =>
          handleChange("city", e.target.value)
        }
      />

      <Input
        label="Date of Birth"
        type="date"
        value={form.dob || ""}
        onChange={(e) =>
          handleChange("dob", e.target.value)
        }
      />

      <Select
        label="Fleet Type"
        value={form.fleetType}
        onChange={(e) =>
          handleChange("fleetType", e.target.value as Fleet["fleetType"])
        }
        options={[
          { label: "Individual", value: "INDIVIDUAL" },
          { label: "Company", value: "COMPANY" },
          { label: "Partnership", value: "PARTNERSHIP" },
        ]}
      />

      <Input
        label="GST Number"
        value={form.gstNumber || ""}
        onChange={(e) =>
          handleChange("gstNumber", e.target.value)
        }
      />

      <Input
        label="PAN Number"
        value={form.panNumber}
        onChange={(e) =>
          handleChange("panNumber", e.target.value)
        }
      />

      <Input
        label="Mode ID"
        value={form.modeId}
        onChange={(e) =>
          handleChange("modeId", e.target.value)
        }
      />

      {/* Optional status (if backend supports later) */}
      {form.status && (
        <Select
          label="Status"
          value={form.status}
          onChange={(e) =>
            handleChange("status", e.target.value as Fleet["status"])
          }
          options={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
        />
      )}

      <Button className="w-full mt-2" onClick={handleSave}>
        Save Changes
      </Button>
    </div>
  );
}
