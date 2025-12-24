import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { deactivateFleet } from "../../api/fleet.api";
import type { Fleet } from "../../models/fleet/fleet";

type Props = {
  fleet: Fleet | null;
  onDeactivated?: () => void;
};

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

export default function FleetDrawer({ fleet, onDeactivated }: Props) {
  const [form, setForm] = useState<Fleet | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fleet);
  }, [fleet]);

  if (!form) return null;

  const isInactive = form.status === "INACTIVE";
  const statusLabel = isInactive ? "Inactive" : "Active";

  async function onDeactivate() {
    if (!form) return;
    if (isInactive) return;
    const ok = window.confirm("Deactivate this fleet? This action cannot be undone.");
    if (!ok) return;

    setSaving(true);
    try {
      const updated = await deactivateFleet(form.id);
      setForm(updated);
      toast.success("Fleet deactivated");
      onDeactivated?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to deactivate fleet"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      <Input
        label="Fleet Owner Name"
        value={form.name}
        disabled
      />

      <Input
        label="Mobile Number"
        value={form.mobile}
        disabled
      />

      <Input
        label="Email"
        value={form.email || ""}
        disabled
      />

      <Input
        label="City"
        value={form.city}
        disabled
      />

      <Input
        label="Date of Birth"
        type="date"
        value={(form.dob || "").slice(0, 10)}
        disabled
      />

      <Input label="Fleet Type" value={form.fleetType} disabled />

      <Input
        label="GST Number"
        value={form.gstNumber || ""}
        disabled
      />

      <Input
        label="PAN Number"
        value={form.panNumber}
        disabled
      />

      <Input
        label="Mode ID"
        value={form.modeId}
        disabled
      />

      <Input label="Status" value={statusLabel} disabled />

      <Button
        className="w-full mt-2"
        variant="secondary"
        onClick={onDeactivate}
        loading={saving}
        disabled={saving || isInactive}
      >
        {isInactive ? "Fleet is inactive" : "Deactivate Fleet"}
      </Button>
    </div>
  );
}