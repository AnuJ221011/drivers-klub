import Modal from "../../../layout/Modal";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import { useState } from "react";
import toast from "react-hot-toast";
import { createFleetManager } from "../../../../api/fleetManager.api";

type Props = {
  open: boolean;
  onClose: () => void;
  fleetId: string;
  onAdded: () => void;
};

export default function AddManagersModal({ open, onClose, fleetId, onAdded }: Props) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await createFleetManager({ fleetId, name, mobile, city });
      toast.success("Manager added");
      onAdded();
      onClose();
      setName("");
      setMobile("");
      setCity("");
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === "object" && "message" in data
          ? String((data as Record<string, unknown>).message)
          : "Failed to add manager";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Managers">
      <div className="space-y-4">
        <Input
          label="Name"
          placeholder="Amit Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Mobile"
          placeholder="9876543211"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
        <Input
          label="City"
          placeholder="Delhi"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={loading}
            disabled={!fleetId || !name || !mobile || !city}
            onClick={() => void onSubmit()}
          >
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}
