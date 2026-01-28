import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { User } from "../models/user/user";
import { getUsers, deactivateUser, updateUser } from "../api/user.api";
import { useFleet } from "../context/FleetContext";
import FleetSelectBar from "../components/fleet/FleetSelectBar";
import { getFleetHubs, type FleetHubEntity } from "../api/fleetHub.api";

function toRoleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "FLEET_ADMIN":
      return "Fleet Admin";
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
  const [users, setUsers] = useState<User[]>([]);
  const [hubs, setHubs] = useState<FleetHubEntity[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "Active" | "Inactive">("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const { effectiveFleetId } = useFleet();

  async function refreshMembers() {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load team"));
    } finally {
      setLoading(false);
    }
  }

  const refreshHubs = useCallback(async () => {
    if (!effectiveFleetId) {
      setHubs([]);
      return;
    }
    try {
      const data = await getFleetHubs(effectiveFleetId);
      setHubs(data || []);
    } catch {
      setHubs([]);
    }
  }, [effectiveFleetId]);

  useEffect(() => {
    void refreshMembers();
  }, []);

  useEffect(() => {
    void refreshHubs();
  }, [refreshHubs]);

  const hubLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of hubs || []) {
      const type = h.hubType ? String(h.hubType) : "Hub";
      const addr = h.address ? String(h.address) : "";
      map.set(h.id, addr ? `${type} • ${addr}` : type);
    }
    return map;
  }, [hubs]);

  const members = useMemo<TeamMember[]>(() => {
    return (users || []).map((u) => {
      const assignedHubIds = (u.hubIds || []).filter(Boolean);
      const assigned = (hubs || []).filter((h) => assignedHubIds.includes(h.id));
      const hubLabels = assigned.map((h) => hubLabelById.get(h.id) || h.id);
      const hubIds = assigned.map((h) => h.id);
      return {
        id: u.id,
        shortId: u.shortId ?? null,
        name: u.name,
        phone: u.phone,
        email: "", // backend does not expose email in User model currently
        role: u.role,
        hubLabels,
        hubIds,
        status: u.isActive ? "Active" : "Inactive",
      };
    });
  }, [users, hubs, hubLabelById]);

  // Keep the drawer selection in sync as hubs/users load
  useEffect(() => {
    if (!selectedMember) return;
    const latest = members.find((m) => m.id === selectedMember.id) || null;
    if (!latest) return;
    // avoid re-setting state if nothing relevant changed
    const prevHubIds = (selectedMember.hubIds || []).join(",");
    const nextHubIds = (latest.hubIds || []).join(",");
    if (prevHubIds !== nextHubIds || selectedMember.role !== latest.role) {
      setSelectedMember(latest);
    }
  }, [members, selectedMember]);

  const filteredMembers = useMemo(() => {
    const nameNeedle = (searchName || "").trim().toLowerCase();
    const phoneNeedle = (searchPhone || "").trim();
    const roleNeedle = (roleFilter || "").trim();

    return members
    .filter((m) => m.role !== "DRIVER")
    .filter((m) => {
      const nameOk = !nameNeedle || (m.name || "").toLowerCase().includes(nameNeedle);
      const phoneOk = !phoneNeedle || (m.phone || "").includes(phoneNeedle);
      const statusOk = !statusFilter || m.status === statusFilter;
      const roleOk = !roleNeedle || m.role === roleNeedle;
      return nameOk && phoneOk && statusOk && roleOk;
    });
  }, [members, searchName, searchPhone, statusFilter, roleFilter]);

  const roleOptions = useMemo(() => {
    const unique = Array.from(new Set((members || []).map((m) => m.role).filter(Boolean))).sort();
    return [{ label: "All Roles", value: "" }].concat(unique.map((r) => ({ label: toRoleLabel(r), value: r })));
  }, [members]);

  const columns: Column<TeamMember>[] = [
    {
      key: "index",
      label: "S.No",
      render: (_, i) => i + 1,
    },
    {
      key: "shortId",
      label: "User ID",
      render: (m) => m.shortId || m.id,
    },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role", render: (m) => toRoleLabel(m.role) },
    {
      key: "hub",
      label: "Hub",
      render: (m) => {
        if (!effectiveFleetId) return <span className="text-xs text-black/60">Select a fleet</span>;
        const items = m.hubLabels || [];
        if (items.length === 0) return "—";
        return (
          <div className="space-y-1 max-w-[320px] whitespace-normal">
            {items.map((x) => (
              <div key={x} className="text-xs leading-snug">
                {x}
              </div>
            ))}
          </div>
        );
      },
    },
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
          <FleetSelectBar className="w-72" />
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
          grid-cols-1 md:grid-cols-4
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
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={roleOptions}
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
        <AddTeamMember
          onClose={() => setOpen(false)}
          onCreated={async () => {
            await Promise.all([refreshMembers(), refreshHubs()]);
          }}
        />
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
            try {
              await updateUser(updated.id, {
                name: updated.name,
                role: updated.role,
                isActive: updated.status === "Active",
                fleetId: updated.fleetId ?? null,
                hubIds: updated.hubIds,
              });

              toast.success("Team member updated successfully");

              setSelectedMember(null);
              await refreshMembers();
            } catch (err: unknown) {
              toast.error(getErrorMessage(err, "Failed to update team member"));
            }
          }}
        />
      </Drawer>

    </div>
  );
}
