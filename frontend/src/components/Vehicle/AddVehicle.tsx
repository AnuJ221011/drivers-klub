import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

type Props = {
  onClose: () => void;
};

export default function AddVehicle({ onClose }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="
        space-y-4
        max-h-[70vh]
        overflow-y-auto
        pr-1
      "
    >
      <Input
        label="Vehicle Number"
        placeholder="DL 01 AB 1234"
      />

      <Input
        label="Brand"
        placeholder="Toyota"
      />

      <Input
        label="Model"
        placeholder="Innova"
      />

      <Select
        label="Body Type"
        options={[
          { label: "Sedan", value: "sedan" },
          { label: "SUV", value: "suv" },
          { label: "Hatchback", value: "hatchback" },
        ]}
      />

      <Select
        label="Fuel Type"
        options={[
          { label: "Petrol", value: "petrol" },
          { label: "Diesel", value: "diesel" },
          { label: "CNG", value: "cng" },
          { label: "Electric", value: "electric" },
        ]}
      />

      <Select
        label="Status"
        options={[
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ]}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button type="submit">
          Save Vehicle
        </Button>
      </div>
    </form>
  );
}
