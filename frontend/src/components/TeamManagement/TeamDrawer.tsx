import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import PhoneInput from "../ui/PhoneInput";
import type { TeamMember } from "../../models/user/team";
import type { UserRole } from "../../models/user/user";
import { useFleet } from "../../context/FleetContext";
import { useAuth } from "../../context/AuthContext";
import { getFleetHubs, type FleetHubEntity } from "../../api/fleetHub.api";

type Props = {
  member: TeamMember | null;
  onSave?: (updated: TeamMember) => void;
};

export default function TeamDrawer({ member, onSave }: Props) {
  // ---------------------------
  // Form State (same as AddTeamMember)
  // ---------------------------
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("OPERATIONS");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [selectedFleetId, setSelectedFleetId] = useState<string | null>(null);
  const [selectedHubIds, setSelectedHubIds] = useState<string[]>([]);

  const [hubs, setHubs] = useState<FleetHubEntity[]>([]);
  const [loadingHubs, setLoadingHubs] = useState(false);
  const [saving, setSaving] = useState(false);

  const { fleets, fleetsLoading } = useFleet();
  const { role: actorRole, fleetId: actorFleetId } = useAuth();

  // ---------------------------
  // Prefill when drawer opens
  // ---------------------------
  useEffect(() => {
    if (!member) return;

    setName(member.name ?? "");
    setPhone(member.phone ?? "");
    setEmail(member.email ?? "");
    setRole(member.role as UserRole);
    setStatus(member.status === "Active" ? "active" : "inactive");
    setSelectedFleetId(member.fleetId ?? null);
    setSelectedHubIds(member.hubIds ?? []);
  }, [member]);

  // ---------------------------
  // Role logic (same as Add)
  // ---------------------------
  const mappedRole = useMemo(() => role, [role]);

  const shouldShowFleet =
    mappedRole === "FLEET_ADMIN" ||
    mappedRole === "MANAGER" ||
    mappedRole === "OPERATIONS";

  const shouldShowHub = mappedRole === "OPERATIONS";

  const canSelectFleet = actorRole === "SUPER_ADMIN" && shouldShowFleet;

  const effectiveFleetId = canSelectFleet
    ? selectedFleetId
    : actorFleetId || null;

  const roleOptions = useMemo(() => {
    if (actorRole === "MANAGER") {
      return [{ label: "Operations", value: "OPERATIONS" as const }];
    }

    if (actorRole === "FLEET_ADMIN") {
      return [
        { label: "Operations", value: "OPERATIONS" as const },
        { label: "Manager", value: "MANAGER" as const },
      ];
    }

    return [
      { label: "Operations", value: "OPERATIONS" as const },
      { label: "Manager", value: "MANAGER" as const },
      { label: "Fleet Admin", value: "FLEET_ADMIN" as const },
      { label: "Super Admin", value: "SUPER_ADMIN" as const },
    ];
  }, [actorRole]);

  // Reset scoped selections when role changes
  useEffect(() => {
    setSelectedFleetId(null);
    setSelectedHubIds([]);
    setHubs([]);
  }, [mappedRole]);

  // ---------------------------
  // Load hubs when fleet changes
  // ---------------------------
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

  if (!member) return null;

  // ---------------------------
  // Save
  // ---------------------------
  const handleSave = async () => {
    if (!name.trim()) return toast.error("Please enter full name");
    if (!phone.trim()) return toast.error("Please enter phone number");

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10)
      return toast.error("Phone number must be 10 digits");

    if (shouldShowFleet && !effectiveFleetId) {
      return toast.error("Please assign a fleet");
    }

    if (shouldShowHub && selectedHubIds.length === 0) {
      return toast.error("Please assign at least one hub");
    }

    try {
      setSaving(true);

      const updated: TeamMember = {
        ...member,
        name: name.trim(),
        phone: digits.slice(0, 10),
        email,
        role,
        status: status === "active" ? "Active" : "Inactive",
        fleetId: shouldShowFleet ? effectiveFleetId : null,
        hubIds: role === "OPERATIONS" ? selectedHubIds : [],
      };

      onSave?.(updated);
      toast.success("Team member updated");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      <Input
        label="Full Name"
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
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={saving}
      />

      <Select
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        options={roleOptions}
        disabled={saving}
      />

      {/* Fleet selection */}
      {canSelectFleet ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">
            Assign Fleet
          </label>

          {fleetsLoading ? (
            <div className="text-xs text-black/60">Loading fleets…</div>
          ) : fleets.length === 0 ? (
            <div className="text-xs text-black/60">No fleets found.</div>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-md border border-black/20 p-2 space-y-2">
              {fleets.map((f) => {
                const checked = selectedFleetId === f.id;
                return (
                  <label
                    key={f.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={saving}
                      onChange={(e) =>
                        setSelectedFleetId(e.target.checked ? f.id : null)
                      }
                    />
                    <span className="leading-snug">{f.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Hub selection */}
      {shouldShowHub ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">
            Assign Hubs
          </label>

          {!effectiveFleetId ? (
            <div className="text-xs text-black/60">
              {canSelectFleet
                ? "Select a fleet to load hubs."
                : "Your account must be scoped to a fleet to assign hubs."}
            </div>
          ) : loadingHubs ? (
            <div className="text-xs text-black/60">Loading hubs…</div>
          ) : hubs.length === 0 ? (
            <div className="text-xs text-black/60">
              No hubs found for this fleet.
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-md border border-black/20 p-2 space-y-2">
              {hubs.map((h) => {
                const label = hubLabelById.get(h.id) || h.id;
                const checked = selectedHubIds.includes(h.id);

                return (
                  <label
                    key={h.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={saving || !effectiveFleetId}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? Array.from(
                              new Set([...selectedHubIds, h.id])
                            )
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
        onChange={(e) =>
          setStatus(e.target.value as "active" | "inactive")
        }
        options={[
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ]}
        disabled={saving}
      />

      <Button
        className="w-full mt-2"
        loading={saving}
        disabled={saving}
        onClick={handleSave}
      >
        Save Changes
      </Button>
    </div>
  );
}
