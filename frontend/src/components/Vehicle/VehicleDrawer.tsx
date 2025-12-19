import type { Vehicle } from "../../api/vehicle.api";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

type Props = {
  vehicle: Vehicle | null;
};

export default function VehicleDrawer({ vehicle }: Props) {
  if (!vehicle) return null;

  return (
    <div className="space-y-4">
      <Input
        label="Vehicle Number"
        value={vehicle.number}
        disabled
      />

      <Input
        label="Brand"
        value={vehicle.brand}
        disabled
      />

      <Input
        label="Model"
        value={vehicle.model}
        disabled
      />

      <Input
        label="Body Type"
        value={vehicle.bodyType}
        disabled
      />  

      <Select
        label="Status"
        value={vehicle.isActive ? 'Active' : 'Inactive'}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
        disabled
      />

      <Button
        className="w-full"
        disabled
      >
        Save Changes (coming soon)
      </Button>
    </div>
  );
}