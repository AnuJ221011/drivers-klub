import { useEffect, useState } from "react";
import type { Vehicle } from "../../utils";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

type Props = {
  vehicle: Vehicle | null;
  onSave?: (updated: Vehicle) => void;
};

export default function VehicleDrawer({ vehicle, onSave }: Props) {
  const [form, setForm] = useState<Vehicle | null>(null);

  useEffect(() => {
    setForm(vehicle);
  }, [vehicle]);

  if (!form) return null;

  const handleChange = (name: keyof Vehicle, value: string) => {
    setForm((prev) =>
      prev ? { ...prev, [name]: value } : prev
    );
  };

  const handleSave = () => {
    onSave?.(form);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Vehicle Number"
        value={form.vehicleNumber}
        onChange={(e) =>
          handleChange("vehicleNumber", e.target.value)
        }
      />

      <Input
        label="Brand"
        value={form.brand}
        onChange={(e) =>
          handleChange("brand", e.target.value)
        }
      />

      <Input
        label="Model"
        value={form.model}
        onChange={(e) =>
          handleChange("model", e.target.value)
        }
      />

      <Select
        label="Status"
        value={form.status}
        onChange={(e) =>
          handleChange("status", e.target.value)
        }
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />

      <Button
        className="w-full"
        onClick={handleSave}
      >
        Save Changes
      </Button>
    </div>
  );
}