import Modal from "../../../layout/Modal";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import PhoneInput from "../../../ui/PhoneInput";
import Select from "../../../ui/Select";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createDriver } from "../../../../api/driver.api";
import { getFleetHubs } from "../../../../api/fleetHub.api";

type Props = {
  open: boolean;
  onClose: () => void;
  fleetId: string;
  onAdded: () => void;
};

export default function AddDriversModal({ open, onClose, fleetId, onAdded }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); // digits only
  const [loading, setLoading] = useState(false);
  const [hubId, setHubId] = useState("");
  const [hubOptions, setHubOptions] = useState<Array<{ label: string; value: string }>>([
    { label: "Unassigned", value: "" },
  ]);

  useEffect(() => {
    if (!fleetId) {
      setHubOptions([{ label: "Unassigned", value: "" }]);
      setHubId("");
      return;
    }
    let mounted = true;
    void (async () => {
      try {
        const hubs = await getFleetHubs(fleetId);
        if (!mounted) return;
        setHubOptions([
          { label: "Unassigned", value: "" },
          ...(hubs || []).map((h) => ({
            label: h.address ? `${h.hubType} • ${h.address}` : String(h.hubType),
            value: h.id,
          })),
        ]);
      } catch {
        // keep defaults
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fleetId]);

  const onSubmit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) return toast.error("Phone number must be 10 digits");
    setLoading(true);
    try {
      const result = await createDriver({
        fleetId,
        name,
        phone: digits.slice(0, 10),
        isActive: true,
        hubId: hubId || undefined,
      });
      toast.success("Driver added");
      if (hubId && !result.hubAssigned) {
        toast.error("Driver created but hub assignment failed");
      }
      onAdded();
      onClose();
      setName("");
      setPhone("");
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === "object" && "message" in data
          ? String((data as Record<string, unknown>).message)
          : "Failed to add driver";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Drivers">
      <div className="space-y-4">
        <Input
          label="Driver Name"
          placeholder="Rohit Kumar"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <PhoneInput
          label="Phone"
          value={phone}
          onChange={setPhone}
        />

        <Select
          label="Hub"
          value={hubId}
          onChange={(e) => setHubId(e.target.value)}
          options={hubOptions}
        />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={loading}
            disabled={!name || !phone || !fleetId}
            onClick={() => void onSubmit()}
          >
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}