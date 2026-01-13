import { useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import PhoneInput from "../ui/PhoneInput";
import { createUser } from "../../api/user.api";
import type { UserRole } from "../../models/user/user";
import { useFleet } from "../../context/FleetContext";
import { getFleetHubs, type FleetHubEntity } from "../../api/fleetHub.api";

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
  const [selectedHubIds, setSelectedHubIds] = useState<string[]>([]);
  const [hubs, setHubs] = useState<FleetHubEntity[]>([]);
  const [loadingHubs, setLoadingHubs] = useState(false);

  const { effectiveFleetId } = useFleet();
  const mappedRole = useMemo(() => mapRole(role), [role]);
  const shouldShowHub = mappedRole === "OPERATIONS";

  useEffect(() => {
    if (!shouldShowHub) return;
    if (!effectiveFleetId) {
      setHubs([]);
      setSelectedHubIds([]);
      return;
    }
    setLoadingHubs(true);
    getFleetHubs(effectiveFleetId)
      .then((data) => setHubs(data || []))
      .catch(() => setHubs([]))
      .finally(() => setLoadingHubs(false));
  }, [effectiveFleetId, shouldShowHub]);

  const hubLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of hubs || []) {
      const type = h.hubType ? String(h.hubType) : "Hub";
      const addr = h.address ? String(h.address) : "";
      map.set(h.id, addr ? `${type} • ${addr}` : type);
    }
    return map;
  }, [hubs]);

  return (
    <form
      className="space-y-4 max-h-[80vh] overflow-y-auto pr-1"
      onSubmit={async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Please enter full name");
        if (!phone.trim()) return toast.error("Please enter phone number");
        const digits = phone.replace(/\D/g, "");
        if (digits.length !== 10) return toast.error("Phone number must be 10 digits");
        if (shouldShowHub) {
          if (!effectiveFleetId) return toast.error("Please select a fleet before assigning a hub");
          if (selectedHubIds.length === 0) return toast.error("Please assign at least one hub for Operations");
        }

        setSaving(true);
        try {
          await createUser({
            name: name.trim(),
            phone: digits.slice(0, 10),
            role: mappedRole,
            isActive: status === "active",
          });

          if (shouldShowHub && selectedHubIds.length > 0) {
            toast(
              "Hubs selected in UI. Backend API needed to save hub assignments.",
              { duration: 4000 },
            );
          }
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

      {shouldShowHub ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Assign Hubs</label>
          {!effectiveFleetId ? (
            <div className="text-xs text-black/60">Select a fleet to load hubs.</div>
          ) : loadingHubs ? (
            <div className="text-xs text-black/60">Loading hubs…</div>
          ) : hubs.length === 0 ? (
            <div className="text-xs text-black/60">No hubs found for this fleet.</div>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-md border border-black/20 p-2 space-y-2">
              {hubs.map((h) => {
                const label = hubLabelById.get(h.id) || h.id;
                const checked = selectedHubIds.includes(h.id);
                return (
                  <label key={h.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={saving || !effectiveFleetId}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? Array.from(new Set([...selectedHubIds, h.id]))
                          : selectedHubIds.filter((x) => x !== h.id);
                        setSelectedHubIds(next);
                      }}
                    />
                    <span className="leading-snug">{label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

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