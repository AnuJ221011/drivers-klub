import { LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";

type HeaderProps = {
  onToggleSidebar: () => void;
  adminName: string;
  role: string;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase();
};

const Header = ({ onToggleSidebar, adminName, role }: HeaderProps) => { 
  const initials = getInitials(adminName);
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const el = menuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setMenuOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  console.log("Name:", adminName, "Role:", role);

  return (
    <header className="h-16 bg-white border-b border-black/10 flex items-center px-4">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-md hover:bg-yellow-100"
      >
        <Menu size={22} />
      </button>

      {/* Desktop title */}
      <h1 className="ml-4 font-semibold text-black hidden sm:block">
        Admin Dashboard
      </h1>

      {/* Mobile title */}
      <span className="ml-4 font-extrabold text-black sm:hidden">
        Drivers Klub
      </span>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-sm font-semibold text-yellow-500"> 
            {adminName}
          </div>
          <div className="text-xs text-gray-500">
            {role}
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="h-9 w-9 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold hover:bg-yellow-500 transition"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {initials}
          </button>

          {menuOpen ? (
            <div
              className="absolute right-0 mt-2 w-24 rounded-md border border-black/10 bg-red-500 shadow-lg overflow-hidden z-50"
              role="menu"
            >
              <button
                type="button"
                className="w-full flex items-center gap-1 text-white text-left px-4 py-1.5 text-sm hover:bg-red-500"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  const ok = window.confirm("Are you sure you want to logout?");
                  if (ok) logout();
                }}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;