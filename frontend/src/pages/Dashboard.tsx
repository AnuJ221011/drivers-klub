import { useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Sidebar, { type SidebarItem } from '../components/Sidebar';
import { clearAuthToken, clearLoggedIn } from '../utils/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const items: SidebarItem[] = useMemo(
    () => [
      { label: 'Manage Driver', to: '/admin/dashboard/drivers' },
      { label: 'Manage Vehicles', to: '/admin/dashboard/vehicles' },
      { label: 'Trips', to: '/admin/dashboard/trips' },
      { label: 'Team Management', to: '/admin/dashboard/team' },
    ],
    [],
  );

  const title = useMemo(() => {
    if (location.pathname.includes('/drivers')) return 'Manage Driver';
    if (location.pathname.includes('/vehicles')) return 'Manage Vehicles';
    if (location.pathname.includes('/trips')) return 'Trips';
    if (location.pathname.includes('/team')) return 'Team Management';
    return 'Dashboard';
  }, [location.pathname]);

  return (
    <div className="h-screen bg-gray-50">
      {/* Route guard: /admin/dashboard -> /admin/dashboard/drivers */}
      {location.pathname === '/admin/dashboard' ? (
        <Navigate to="/admin/dashboard/drivers" replace />
      ) : null}

      <div className="flex h-full">
        <Sidebar collapsed={collapsed} items={items} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? '»' : '«'}
              </button>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
                <div className="truncate text-xs text-gray-500">Admin Panel</div>
              </div>
            </div>

            <Button
              onClick={() => {
                clearAuthToken();
                clearLoggedIn();
                navigate('/login', { replace: true });
              }}
              className="bg-gray-900"
            >
              Logout
            </Button>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

