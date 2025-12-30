import Modal from "../../../layout/Modal";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import { useState } from "react";
import toast from "react-hot-toast";
import { createDriver } from "../../../../api/driver.api";

type Props = {
  open: boolean;
  onClose: () => void;
  fleetId: string;
  onAdded: () => void;
};

export default function AddDriversModal({ open, onClose, fleetId, onAdded }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await createDriver({ fleetId, name, phone, isActive: true });
      toast.success("Driver added");
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
        <Input
          label="Phone"
          placeholder="9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
