import { NavLink } from 'react-router-dom';

export type SidebarItem = {
  label: string;
  to: string;
};

type SidebarProps = {
  collapsed: boolean;
  items: SidebarItem[];
};

export default function Sidebar({ collapsed, items }: SidebarProps) {
  return (
    <aside
      className={`h-full border-r border-gray-200 bg-white transition-all ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-sm font-semibold text-white">
          TF
        </div>
        {collapsed ? null : (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">Tribore Fleet</div>
            <div className="truncate text-xs text-gray-500">Admin</div>
          </div>
        )}
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                    isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100',
                  ].join(' ')
                }
                end
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    collapsed ? '' : 'bg-gray-100'
                  }`}
                  aria-hidden
                >
                  {item.label.slice(0, 1).toUpperCase()}
                </span>
                {collapsed ? null : <span className="font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
