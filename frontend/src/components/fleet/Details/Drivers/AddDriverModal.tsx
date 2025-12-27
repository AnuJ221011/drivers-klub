import Modal from "../../../layout/Modal";
import Button from "../../../ui/Button";

type Props = {
  open: boolean;
  onClose: () => void;
};

const availableDrivers = [
  { id: "d3", name: "Suresh", phone: "9000000001" },
  { id: "d4", name: "Ravi", phone: "9000000002" },
];

export default function AddDriversModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Add Drivers">
      <div className="space-y-4">
        {availableDrivers.map((d) => (
          <label
            key={d.id}
            className="flex items-center gap-3 border p-2 rounded"
          >
            <input type="checkbox" />
            <div>
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-black/60">{d.phone}</div>
            </div>
          </label>
        ))}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button>Add Selected</Button>
        </div>
      </div>
    </Modal>
  );
}

