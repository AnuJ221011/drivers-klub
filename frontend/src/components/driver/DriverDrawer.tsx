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
        disabled
      />

      <Input
        label="Phone Number"
        defaultValue={driver.phone}
        disabled
      />

      <Select
        label="Status"
        value={driver.isActive ? 'Active' : 'Inactive'}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
        disabled
      />

      <Button className="w-full" disabled>
        Save Changes (coming soon)
      </Button>
    </div>
  );
}