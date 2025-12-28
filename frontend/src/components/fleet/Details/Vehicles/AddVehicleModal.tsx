import { useState } from "react";
import toast from "react-hot-toast";
import { createVehicle } from "../../../../api/vehicle.api";
import Modal from "../../../layout/Modal";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import Select from "../../../ui/Select";

type Props = {
  open: boolean;
  onClose: () => void;
  fleetId: string;
  onAdded: () => void;
};

export default function AddVehiclesModal({ open, onClose, fleetId, onAdded }: Props) {
  const [number, setNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [bodyType, setBodyType] = useState<"SEDAN" | "SUV" | "HATCHBACK">("SEDAN");
  const [fuelType, setFuelType] = useState<"PETROL" | "DIESEL" | "CNG" | "EV">("EV");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await createVehicle({
        fleetId,
        number,
        brand,
        model,
        bodyType,
        fuelType,
        isActive: true,
      });
      toast.success("Vehicle added");
      onAdded();
      onClose();
      setNumber("");
      setBrand("");
      setModel("");
      setBodyType("SEDAN");
      setFuelType("EV");
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === "object" && "message" in data
          ? String((data as Record<string, unknown>).message)
          : "Failed to add vehicle";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Vehicle">
      <div className="space-y-4">
        <Input
          label="Vehicle Number"
          placeholder="DL01CAB1234"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <Input
          label="Brand"
          placeholder="Tata"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
        <Input
          label="Model"
          placeholder="Tigor EV"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />

        <Select
          label="Body Type"
          value={bodyType}
          onChange={(e) => setBodyType(e.target.value as typeof bodyType)}
          options={[
            { label: "Sedan", value: "SEDAN" },
            { label: "SUV", value: "SUV" },
            { label: "Hatchback", value: "HATCHBACK" },
          ]}
        />

        <Select
          label="Fuel Type"
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value as typeof fuelType)}
          options={[
            { label: "EV", value: "EV" },
            { label: "Petrol", value: "PETROL" },
            { label: "Diesel", value: "DIESEL" },
            { label: "CNG", value: "CNG" },
          ]}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={loading}
            disabled={!fleetId || !number || !brand || !model}
            onClick={() => void onSubmit()}
          >
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}
