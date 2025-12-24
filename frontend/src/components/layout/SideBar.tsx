import { Home, Car, Users, UserCircle, ArrowRightCircle, X, LogOut, Building2 } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useFleet } from "../../context/FleetContext";
import FleetSelectModal from "../fleet/FleetSelectModal";

type SidebarProps = {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
};

const navItems = [
  { name: "Dashboard", icon: Home, path: "/admin" },
  { name: "Fleets", icon: Building2, path: "/admin/fleets" },
  { name: "Trips", icon: ArrowRightCircle, path: "/admin/trips" },
  { name: "Vehicles", icon: Car, path: "/admin/vehicles" },
  { name: "Drivers", icon: UserCircle, path: "/admin/drivers" },
  { name: "Team Management", icon: Users, path: "/admin/team-management" },

];

export default function Sidebar({
  isOpen,
  isMobile,
  onClose,
}: SidebarProps) {
  const { logout } = useAuth();
  const { setActiveFleetId } = useFleet();
  const [fleetModalOpen, setFleetModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fleetScopedPaths = new Set<string>(["/admin/trips", "/admin/vehicles", "/admin/drivers"]);

  function openFleetPicker(nextPath: string) {
    setPendingPath(nextPath);
    setFleetModalOpen(true);
  }

  function isPathActive(path: string) {
    // keep nav highlight stable when using buttons for fleet-scoped pages
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  }

  return (
    <>
      {/* Overlay (mobile only) */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed z-50 md:static
          h-screen bg-white border-r border-black/10
          transition-all duration-300
          ${isMobile
            ? isOpen
              ? "translate-x-0 w-44"
              : "-translate-x-full w-64"
            : isOpen
            ? "w-64"
            : "w-16"}
        `}
      >
        <FleetSelectModal
          open={fleetModalOpen}
          onClose={() => setFleetModalOpen(false)}
          onSelected={(fleetId) => {
            setActiveFleetId(fleetId);
            setFleetModalOpen(false);
            const next = pendingPath || "/admin";
            setPendingPath(null);
            navigate(next);
            if (isMobile) onClose();
          }}
          title="Select Fleet"
        />

        {/* Wrapper */}
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <span className="font-extrabold text-black">
              {isOpen ? "Driver’s Klub" : ""}
            </span>

            {isMobile && (
              <button onClick={onClose}>
                <X size={20} />
              </button>
            )}
          </div>

          {/* Nav */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => (
              fleetScopedPaths.has(item.path) ? (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => openFleetPicker(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                    isPathActive(item.path)
                      ? "bg-yellow-400 text-black"
                      : "text-black hover:bg-yellow-200"
                  }`}
                >
                  <item.icon size={18} />
                  {isOpen && <span>{item.name}</span>}
                </button>
              ) : (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                   ${
                     isActive
                       ? "bg-yellow-400 text-black"
                       : "text-black hover:bg-yellow-200"
                   }`
                  }
                  onClick={isMobile ? onClose : undefined}
                >
                  <item.icon size={18} />
                  {isOpen && <span>{item.name}</span>}
                </NavLink>
              )
            ))}
          </nav>

          {/* Logout (sticks to bottom) */}
          <div className="mt-auto p-2 border-t">
            <button
              className="w-full flex items-center gap-3 px-3 py-2
                         rounded-md text-sm font-medium
                         text-red-500 hover:bg-red-600"
              onClick={() => {
                logout();
              }}
            >
              <LogOut size={18} />
              {isOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}