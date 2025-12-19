
import { useEffect, useMemo, useState } from "react";
import { Pencil, Filter } from "lucide-react";
import toast from "react-hot-toast";

import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

import Modal from "../components/layout/Modal";
import Drawer from "../components/layout/Drawer";

import AddTeamMember from "../components/TeamManagement/AddTeamMember";
import TeamDrawer from "../components/TeamManagement/TeamDrawer";

import type { Column } from "../components/ui/Table";
import type { TeamMember } from "../models/user/team";
import { getUsers, deactivateUser } from "../api/user.api";

function toRoleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Admin";
    case "OPERATIONS":
      return "Operations";
    case "MANAGER":
      return "Manager";
    case "DRIVER":
      return "Driver";
    default:
      return role;
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const maybeAny = err as { response?: { data?: unknown } };
    const data = maybeAny.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      return String((data as Record<string, unknown>).message);
    }
  }
  return fallback;
}

export default function Team() {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<TeamMember | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "Active" | "Inactive">("");

  async function refreshMembers() {
    setLoading(true);
    try {
      const users = await getUsers();
      setMembers(
        (users || []).map((u) => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: "", // backend does not expose email in User model currently
          role: toRoleLabel(u.role),
          status: u.isActive ? "Active" : "Inactive",
        })),
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load team"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const nameNeedle = (searchName || "").trim().toLowerCase();
    const phoneNeedle = (searchPhone || "").trim();

    return members.filter((m) => {
      const nameOk = !nameNeedle || (m.name || "").toLowerCase().includes(nameNeedle);
      const phoneOk = !phoneNeedle || (m.phone || "").includes(phoneNeedle);
      const statusOk = !statusFilter || m.status === statusFilter;
      return nameOk && phoneOk && statusOk;
    });
  }, [members, searchName, searchPhone, statusFilter]);

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
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            m.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
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
        <Input
          placeholder="Search by Name"
          className="mb-3"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          placeholder="Search by Phone"
          className="mb-2"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          options={[
            { label: "All Status", value: "" },
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-black/60">Loading team…</div>
      ) : (
        <Table columns={columns} data={filteredMembers} />
      )}

      {/* Add Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Team Member">
        <AddTeamMember onClose={() => setOpen(false)} onCreated={() => void refreshMembers()} />
      </Modal>

      {/* Edit Drawer */}
      <Drawer
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Edit Team Member"
      >
        <TeamDrawer
          member={selectedMember}
          onSave={async (updated) => {
            // Backend currently supports deactivation only.
            if (updated.status === "Inactive") {
              try {
                await deactivateUser(updated.id);
                toast.success("User deactivated");
                setSelectedMember(null);
                await refreshMembers();
              } catch (err: unknown) {
                toast.error(getErrorMessage(err, "Failed to deactivate user"));
              }
            } else {
              toast.error("Re-activation not supported yet");
            }
          }}
        />
      </Drawer>
    </div>
  );
}