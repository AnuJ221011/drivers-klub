import { Menu } from "lucide-react";

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

        <div className="h-9 w-9 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Header;
