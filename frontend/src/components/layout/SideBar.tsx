// import { useMemo } from "react";
// import { Home, Car, Users, UserCircle, ArrowRightCircle, X, LogOut, Building2, ClipboardCheck, CreditCard, SlidersHorizontal } from "lucide-react";
// import { NavLink, useLocation } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";

// type SidebarProps = {
//   isOpen: boolean;
//   isMobile: boolean;
//   onClose: () => void;
// };

// const navItems = [
//   { name: "Dashboard", icon: Home, path: "/admin" },
//   { name: "Fleets", icon: Building2, path: "/admin/fleets" },
//   { name: "Trips", icon: ArrowRightCircle, path: "/admin/trips" },
//   { name: "Vehicles", icon: Car, path: "/admin/vehicles" },
//   { name: "Drivers", icon: UserCircle, path: "/admin/drivers" },
//   { name: "Driver Preferences", icon: SlidersHorizontal, path: "/admin/driver-preferences" },
//   { name: "Team Management", icon: Users, path: "/admin/team-management" },
//   { name: "Driver Check-ins", icon: ClipboardCheck,path: "/admin/driver-checkins",},
//   { name: "Payment & Pricing", icon: CreditCard, path: "/admin/payment" },
//   { name: "Clients", icon: CreditCard, path: "/admin/client" },

// ];

// export default function Sidebar({
//   isOpen,
//   isMobile,
//   onClose,
// }: SidebarProps) {
//   const { logout, role, fleetId } = useAuth();
//   const location = useLocation();

//   const resolvedNavItems = useMemo(() => {
//     return navItems.map((item) => {
//       if (item.path === "/admin/fleets" && role !== "SUPER_ADMIN" && fleetId) {
//         return { ...item, path: `/admin/fleets/${fleetId}` };
//       }
//       return item;
//     });
//   }, [role, fleetId]);

//   function isPathActive(path: string) {
//     // keep nav highlight stable when using buttons for fleet-scoped pages
//     if (path === "/admin") return location.pathname === "/admin";
//     return location.pathname.startsWith(path);
//   }

//   return (
//     <>
//       {/* Overlay (mobile only) */}
//       {isMobile && isOpen && (
//         <div
//           className="fixed inset-0 bg-black/40 z-40"
//           onClick={onClose}
//         />
//       )}

//       <aside
//         className={`
//           fixed z-50 md:static
//           h-screen bg-white border-r border-black/10
//           transition-all duration-300
//           ${isMobile
//             ? isOpen
//               ? "translate-x-0 w-44"
//               : "-translate-x-full w-64"
//             : isOpen
//             ? "w-64"
//             : "w-16"}
//         `}
//       >
//         {/* Wrapper */}
//         <div className="flex h-full flex-col">
//           {/* Header */}
//           <div className="h-16 flex items-center justify-between px-4 border-b">
//             <span className="font-extrabold text-black">
//               {isOpen ? "Driver’s Klub" : ""}
//             </span>

//             {isMobile && (
//               <button onClick={onClose}>
//                 <X size={20} />
//               </button>
//             )}
//           </div>

//           {/* Nav */}
//           <nav className="p-2 space-y-1">
//             {resolvedNavItems.map((item) => (
//               <NavLink
//                 key={item.name}
//                 to={item.path}
//                 end={item.path === "/admin"}
//                 className={() =>
//                   `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
//                     isPathActive(item.path)
//                       ? "bg-yellow-400 text-black"
//                       : "text-black hover:bg-yellow-200"
//                   }`
//                 }
//                 onClick={isMobile ? onClose : undefined}
//               >
//                 <item.icon size={18} />
//                 {isOpen && <span>{item.name}</span>}
//               </NavLink>
//             ))}
//           </nav>

//           {/* Logout (sticks to bottom) */}
//           <div className="mt-auto p-2 border-t">
//             <button
//               className="w-full flex items-center gap-3 px-3 py-2
//                          rounded-md text-sm font-medium
//                          text-red-500 hover:bg-red-600 hover:text-white"
//               onClick={() => {
//                 logout();
//               }}
//             >
//               <LogOut size={18} />
//               {isOpen && <span>Logout</span>}
//             </button>
//           </div>
//         </div>
//       </aside>
//     </>
//   );
// }

import { Home, Car, Users, UserCircle, ArrowRightCircle, X, LogOut, Building2, ClipboardCheck, CreditCard, SlidersHorizontal, Briefcase } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
  { name: "Driver Preferences", icon: SlidersHorizontal, path: "/admin/driver-preferences" },
  { name: "Clients", icon: Briefcase, path: "/admin/client" },
  { name: "Team Management", icon: Users, path: "/admin/team-management" },
  { name: "Driver Check-ins", icon: ClipboardCheck,path: "/admin/driver-checkins",},
  { name: "Payment & Pricing", icon: CreditCard, path: "/admin/payment" },

];

export default function Sidebar({
  isOpen,
  isMobile,
  onClose,
}: SidebarProps) {
  const { logout } = useAuth();
  const location = useLocation();

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
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/admin"}
                className={() =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                    isPathActive(item.path)
                      ? "bg-yellow-400 text-black"
                      : "text-black hover:bg-yellow-200"
                  }`
                }
                onClick={isMobile ? onClose : undefined}
              >
                <item.icon size={18} />
                {isOpen && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Logout (sticks to bottom) */}
          <div className="mt-auto p-2 border-t">
            <button
              className="w-full flex items-center gap-3 px-3 py-2
                         rounded-md text-sm font-medium
                         text-red-500 hover:bg-red-600 hover:text-white"
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