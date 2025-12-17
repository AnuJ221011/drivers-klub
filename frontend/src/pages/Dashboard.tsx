import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { clearAuthToken, clearLoggedIn } from '../utils/auth';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
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
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-sm text-gray-600">
            You’re logged in. Replace this page with your real admin dashboard.
          </div>
        </div>
      </div>
    </div>
  );
}
