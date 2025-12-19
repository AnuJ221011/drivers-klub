
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/layout/SideBar";
import Header from "../components/layout/Header";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // 🔹 Mock backend data (replace later with API)
  const admin = {
    name: "Anuj Kumar",
    role: "Admin",
  };

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
          adminName={admin.name}
          role={admin.role}
        />

        <main className="flex-1 overflow-y-auto p-6 pt-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
