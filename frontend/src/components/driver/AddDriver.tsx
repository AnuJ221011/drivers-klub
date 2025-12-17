import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

type Props = {
  onClose: () => void;
};

export default function AddDriver({ onClose }: Props) {
  return (
    <form className="space-y-4">
      <Input label="Driver Name" placeholder="Enter name" />
      <Input label="Phone Number" placeholder="Enter phone number" />

      <Select
        label="Status"
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Driver</Button>
      </div>
    </form>
  );
}
