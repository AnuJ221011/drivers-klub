import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/layout/SideBar";
import Header from "../components/layout/Header";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const { user, role, userId } = useAuth();
  console.log("useAuth returned - userId:", userId, "role:", role, "user:", user);
  console.log("User name:", user?.name);
  const adminName = user?.name || userId || "Admin";
  const adminRole = role || "SUPER_ADMIN";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const handleResize = () => {
      setIsMobile(mediaQuery.matches);
      setIsSidebarOpen(!mediaQuery.matches);
    };

    handleResize();
    mediaQuery.addEventListener("change", handleResize);

    return () =>
      mediaQuery.removeEventListener("change", handleResize);
  }, []);

  console.log("Dashboard Rendered - Name:", adminName, "Role:", adminRole);
  console.log("user:", user);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          adminName={adminName}
          role={adminRole}
        />

        <main className="flex-1 overflow-y-auto p-6 pt-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}