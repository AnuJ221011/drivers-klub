import { useEffect, useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

/* Local type (no shared import) */
type TeamMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
};

type Props = {
  member: TeamMember | null;
  onSave?: (updated: TeamMember) => void;
};

export default function TeamDrawer({ member, onSave }: Props) {
  const [form, setForm] = useState<TeamMember | null>(null);

  useEffect(() => {
    setForm(member);
  }, [member]);

  if (!form) return null;

  const handleChange = <K extends keyof TeamMember>(
    key: K,
    value: TeamMember[K]
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
      <Input
        label="Full Name"
        value={form.name}
        onChange={(e) =>
          handleChange("name", e.target.value)
        }
      />

      <Input
        label="Phone Number"
        value={form.phone}
        onChange={(e) =>
          handleChange("phone", e.target.value)
        }
      />

      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) =>
          handleChange("email", e.target.value)
        }
      />

      <Select
        label="Role"
        value={form.role}
        onChange={(e) =>
          handleChange("role", e.target.value)
        }
        options={[
          { label: "Operations Manager", value: "Operations Manager" },
          { label: "Supervisor", value: "Supervisor" },
          { label: "Admin", value: "Admin" },
        ]}
      />

      <Select
        label="Status"
        value={form.status}
        onChange={(e) =>
          handleChange("status", e.target.value as TeamMember["status"])
        }
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />

      <Button className="w-full mt-2" onClick={handleSave}>
        Save Changes
      </Button>
    </div>
  );
}
