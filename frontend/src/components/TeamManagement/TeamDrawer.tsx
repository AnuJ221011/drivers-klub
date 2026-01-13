import { useEffect, useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import type { TeamMember } from "../../models/user/team";
import PhoneInput from "../ui/PhoneInput";

type HubOption = { id: string; label: string };

type Props = {
  member: TeamMember | null;
  hubOptions?: HubOption[];
  hubsDisabled?: boolean;
  onSave?: (updated: TeamMember) => void;
};

export default function TeamDrawer({ member, hubOptions = [], hubsDisabled = false, onSave }: Props) {
  const [form, setForm] = useState<TeamMember | null>(null);

  useEffect(() => {
    setForm(member);
  }, [member]);

  if (!form) return null;

  // Operations Manager + Manager can belong to one or more hubs
  const normalizedRole = String(form.role || "").trim().toLowerCase();
  const canEditHubs =
    normalizedRole === "manager" ||
    normalizedRole.includes("operation"); // supports values like "OPERATIONS", "Operations Manager", "OPERATIONS_MANAGER"

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

      <PhoneInput
        label="Phone Number"
        value={form.phone}
        onChange={(digits) => handleChange("phone", digits)}
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
          { label: "Operations", value: "Operations" },
          { label: "Manager", value: "Manager" },
          { label: "Admin", value: "Admin" },
        ]}
      />

      {canEditHubs ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Assigned Hubs</label>
          {hubsDisabled ? (
            <div className="text-xs text-black/60">Select a fleet to edit hub assignments.</div>
          ) : hubOptions.length === 0 ? (
            <div className="text-xs text-black/60">No hubs available.</div>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-md border border-black/20 p-2 space-y-2">
              {hubOptions.map((h) => {
                const current = form.hubIds || [];
                const checked = current.includes(h.id);
                return (
                  <label key={h.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={hubsDisabled}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? Array.from(new Set([...current, h.id]))
                          : current.filter((x) => x !== h.id);
                        handleChange("hubIds", next);
                      }}
                    />
                    <span className="leading-snug">{h.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

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