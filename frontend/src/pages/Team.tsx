
import { useState } from "react";
import { Pencil, Filter } from "lucide-react";

import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

import Modal from "../components/layout/Modal";
import Drawer from "../components/layout/Drawer";

import AddTeamMember from "../components/TeamManagement/AddTeamMember";
import TeamDrawer from "../components/TeamManagement/TeamDrawer";

import type { Column } from "../components/ui/Table";

export type TeamMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
};

const mockTeam: TeamMember[] = [
  {
    id: "1",
    name: "Saurabh",
    phone: "+91 7065381349",
    email: "saurabh.yadav@tdf.in",
    role: "Operations Manager",
    status: "Active",
  },
];

export default function Team() {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<TeamMember | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const columns: Column<TeamMember>[] = [
    {
      key: "index",
      label: "S.No",
      render: (_, i) => i + 1,
    },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    {
      key: "status",
      label: "Status",
      render: (m) => (
        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
          {m.status}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (m) => (
        <button
          onClick={() => setSelectedMember(m)}
          className="p-2 hover:bg-yellow-100 rounded"
        >
          <Pencil size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Team</h1>
        <div className="flex items-center gap-2">
          {/* Funnel (mobile only) */}
         
          <Button
            variant="secondary"
            className="md:hidden"
            onClick={() => setShowFilters((p) => !p)}
          >
            <Filter size={16} />
          </Button>

          <Button onClick={() => setOpen(true)}>
            + Team Member
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`
          ${showFilters ? "block" : "hidden"}
          md:grid
          grid-cols-1 md:grid-cols-3
          gap-4 
        `}
      >
        <Input  placeholder="Search by Name" className="mb-3" />
        <Input  placeholder="Search by Phone" className="mb-2"/>
        <Select
          
          options={[
            { label: "All Status", value: "" },
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
        />
      </div>

      {/* Table */}
      <Table columns={columns} data={mockTeam} />

      {/* Add Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Team Member">
        <AddTeamMember onClose={() => setOpen(false)} />
      </Modal>

      {/* Edit Drawer */}
      <Drawer
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Edit Team Member"
      >
        <TeamDrawer member={selectedMember} />
      </Drawer>
    </div>
  );
}