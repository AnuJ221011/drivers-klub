import Modal from "../../../layout/Modal";
import Button from "../../../ui/Button";

export default function AddDriversModal({ open, onClose }: any) {
  return (
    <Modal open={open} onClose={onClose} title="Add Drivers">
      <div className="space-y-3">
        <label className="flex gap-2">
          <input type="checkbox" />
          Rohit Kumar
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button>Add</Button>
        </div>
      </div>
    </Modal>
  );
}
