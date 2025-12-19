import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

type Props = {
  onClose: () => void;
};

export default function AddTeamMember({ onClose }: Props) {
  return (
    <form
      className="space-y-4 max-h-[80vh] overflow-y-auto pr-1"
      onSubmit={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <Input
        label="Full Name"
        placeholder="Saurabh Yadav"
      />

      <Input
        label="Phone Number"
        placeholder="+91XXXXXXXXXX"
        type="tel"
      />

      <Input
        label="Email"
        placeholder="saurabh.yadav@company.com"
        type="email"
      />

      <Select
        label="Role"
        options={[
          { label: "Operations Manager", value: "operations_manager" },
          { label: "Admin", value: "admin" },
          { label: "Support", value: "support" },
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
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button type="submit">
          Add Team Member
        </Button>
      </div>
    </form>
  );
}
