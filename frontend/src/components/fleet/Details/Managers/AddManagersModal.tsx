import Modal from "../../../layout/Modal";
import Button from "../../../ui/Button";

type Props = {
  open: boolean;
  onClose: () => void;
};

const mockManagers = [
  { id: "1", name: "Amit Sharma", phone: "9876543211" },
  { id: "2", name: "Neha Verma", phone: "9876543222" },
];

export default function AddManagersModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Add Managers">
      <div className="space-y-4">
        {mockManagers.map((m) => (
          <label
            key={m.id}
            className="flex items-center gap-3 border p-3 rounded cursor-pointer hover:bg-yellow-50"
          >
            <input type="checkbox" />
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-black/60">{m.phone}</p>
            </div>
          </label>
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button>Add Selected</Button>
        </div>
      </div>
    </Modal>
  );
}

