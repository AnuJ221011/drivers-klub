import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import PhoneInput from "../ui/PhoneInput";
import { createUser } from "../../api/user.api";
import type { UserRole } from "../../models/user/user";

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

function mapRole(value: string): UserRole {
  switch (value) {
    case "operations_manager":
      return "OPERATIONS";
    case "admin":
      return "SUPER_ADMIN";
    case "support":
      return "OPERATIONS";
    default:
      return "OPERATIONS";
  }
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

export default function AddTeamMember({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); // digits only
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("operations_manager");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-4 max-h-[80vh] overflow-y-auto pr-1"
      onSubmit={async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Please enter full name");
        if (!phone.trim()) return toast.error("Please enter phone number");
        const digits = phone.replace(/\D/g, "");
        if (digits.length !== 10) return toast.error("Phone number must be 10 digits");

        setSaving(true);
        try {
          await createUser({
            name: name.trim(),
            phone: digits.slice(0, 10),
            role: mapRole(role),
            isActive: status === "active",
          });
          toast.success("Team member created");
          onCreated?.();
          onClose();
        } catch (err: unknown) {
          toast.error(getErrorMessage(err, "Failed to create team member"));
        } finally {
          setSaving(false);
        }
      }}
    >
      <Input
        label="Full Name"
        placeholder="Saurabh Yadav"
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

      <Input
        label="Email"
        placeholder="saurabh.yadav@company.com"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={saving}
      />

      <Select
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        options={[
          { label: "Operations Manager", value: "operations_manager" },
          { label: "Admin", value: "admin" },
          { label: "Support", value: "support" },
        ]}
        disabled={saving}
      />

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        options={[
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ]}
        disabled={saving}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button type="submit" loading={saving} disabled={saving}>
          Add Team Member
        </Button>
      </div>
    </form>
  );
}