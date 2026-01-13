import { useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import PhoneInput from "../ui/PhoneInput";
import { createUser } from "../../api/user.api";
import type { UserRole } from "../../models/user/user";
import { useAuth } from "../../context/AuthContext";
import { useFleet } from "../../context/FleetContext";
import { getFleets } from "../../api/fleet.api";
import type { Fleet } from "../../models/fleet/fleet";
import { getFleetHubs } from "../../api/fleetHub.api";
import type { FleetHubEntity } from "../../api/fleetHub.api";

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

type UiRole = "FLEET_ADMIN" | "MANAGER" | "OPERATIONS";

function toBackendRole(value: UiRole): UserRole {
  if (value === "FLEET_ADMIN") return "FLEET_ADMIN";
  if (value === "MANAGER") return "MANAGER";
  return "OPERATIONS";
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
  const { role: actorRole, fleetId: actorFleetId } = useAuth();
  const { effectiveFleetId } = useFleet();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); // digits only
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UiRole>("OPERATIONS");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [fleetsLoading, setFleetsLoading] = useState(false);
  const [selectedFleetIds, setSelectedFleetIds] = useState<string[]>([]);

  const [hubs, setHubs] = useState<FleetHubEntity[]>([]);
  const [hubsLoading, setHubsLoading] = useState(false);
  const [selectedHubIds, setSelectedHubIds] = useState<string[]>([]);

  const canChooseFleet = actorRole === "SUPER_ADMIN";

  const resolvedFleetIdForCreate = useMemo(() => {
    // For SUPER_ADMIN: use checkbox selection (single for now)
    if (canChooseFleet) return selectedFleetIds[0] || null;
    // For FLEET_ADMIN/MANAGER/OPERATIONS: use scoped fleet
    return effectiveFleetId || actorFleetId || null;
  }, [canChooseFleet, selectedFleetIds, effectiveFleetId, actorFleetId]);

  // Load fleets only for SUPER_ADMIN (because only they can choose fleet)
  useEffect(() => {
    if (!canChooseFleet) return;
    let mounted = true;
    void (async () => {
      setFleetsLoading(true);
      try {
        const data = await getFleets();
        if (!mounted) return;
        setFleets(data || []);
      } catch {
        if (mounted) setFleets([]);
      } finally {
        if (mounted) setFleetsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [canChooseFleet]);

  // Load hubs for OPERATIONS when fleet is known
  useEffect(() => {
    if (role !== "OPERATIONS") {
      setHubs([]);
      setSelectedHubIds([]);
      return;
    }
    const fleetId = resolvedFleetIdForCreate;
    if (!fleetId) {
      setHubs([]);
      setSelectedHubIds([]);
      return;
    }
    let mounted = true;
    void (async () => {
      setHubsLoading(true);
      try {
        const data = await getFleetHubs(fleetId);
        if (!mounted) return;
        setHubs(data || []);
      } catch {
        if (mounted) setHubs([]);
      } finally {
        if (mounted) setHubsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [role, resolvedFleetIdForCreate]);

  // Reset selection when role changes
  useEffect(() => {
    setSelectedHubIds([]);
  }, [role]);

  return (
    <form
      className="space-y-4 max-h-[80vh] overflow-y-auto pr-1"
      onSubmit={async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Please enter full name");
        if (!phone.trim()) return toast.error("Please enter phone number");
        const digits = phone.replace(/\D/g, "");
        if (digits.length !== 10) return toast.error("Phone number must be 10 digits");

        const fleetId = resolvedFleetIdForCreate;
        if ((role === "FLEET_ADMIN" || role === "MANAGER" || role === "OPERATIONS") && !fleetId) {
          return toast.error("Please select a fleet");
        }
        if (role === "OPERATIONS" && selectedHubIds.length === 0) {
          return toast.error("Please select at least one hub");
        }

        setSaving(true);
        try {
          await createUser({
            name: name.trim(),
            phone: digits.slice(0, 10),
            role: toBackendRole(role),
            isActive: status === "active",
            fleetId: fleetId || undefined,
            hubIds: role === "OPERATIONS" ? selectedHubIds : undefined,
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
        onChange={(e) => setRole(e.target.value as UiRole)}
        options={[
          { label: "Fleet Admin", value: "FLEET_ADMIN" },
          { label: "Manager", value: "MANAGER" },
          { label: "Operations", value: "OPERATIONS" },
        ]}
        disabled={saving}
      />

      {/* Fleet selection (checkbox UI) */}
      {role !== "OPERATIONS" || canChooseFleet ? (
        <div className="space-y-2">
          <div className="text-sm font-medium text-black">Fleet</div>
          {!canChooseFleet ? (
            <div className="text-sm text-black/70">
              Assigned Fleet: <span className="font-medium">{resolvedFleetIdForCreate || "—"}</span>
            </div>
          ) : fleetsLoading ? (
            <div className="text-sm text-black/60">Loading fleets…</div>
          ) : (
            <div className="space-y-2">
              {(fleets || []).map((f) => {
                const checked = selectedFleetIds.includes(f.id);
                return (
                  <label key={f.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        // single-select behavior via checkbox (as requested)
                        if (e.target.checked) setSelectedFleetIds([f.id]);
                        else setSelectedFleetIds([]);
                      }}
                      disabled={saving}
                    />
                    <span>{f.name} ({f.city})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Hub selection for OPERATIONS */}
      {role === "OPERATIONS" ? (
        <div className="space-y-2">
          <div className="text-sm font-medium text-black">Hubs</div>
          {!resolvedFleetIdForCreate ? (
            <div className="text-sm text-black/60">Select a fleet first.</div>
          ) : hubsLoading ? (
            <div className="text-sm text-black/60">Loading hubs…</div>
          ) : hubs.length === 0 ? (
            <div className="text-sm text-black/60">No hubs found for this fleet.</div>
          ) : (
            <div className="space-y-2">
              {hubs.map((h) => {
                const checked = selectedHubIds.includes(h.id);
                const label = h.address ? `${h.hubType} • ${h.address}` : h.hubType;
                return (
                  <label key={h.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedHubIds((prev) => [...prev, h.id]);
                        else setSelectedHubIds((prev) => prev.filter((x) => x !== h.id));
                      }}
                      disabled={saving}
                    />
                    <span>{label}</span>
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