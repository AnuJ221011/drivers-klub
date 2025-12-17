import type { Driver } from "../../utils/index";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

type Props = {
  driver: Driver | null;
};

export default function DriverDrawer({ driver }: Props) {
  if (!driver) return null;

  return (
    <div className="space-y-4">
      <Input
        label="Driver Name"
        defaultValue={driver.name}
      />

      <Input
        label="Phone Number"
        defaultValue={driver.phone}
      />

      <Select
        label="Status"
        defaultValue={driver.status}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />

      <Input
        label="Rating"
        type="number"
        step="0.1"
        defaultValue={driver.rating?.toString()}
      />

      <Button className="w-full">
        Save Changes
      </Button>
    </div>
  );
}
