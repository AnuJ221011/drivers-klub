import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import { isAuthenticated } from './utils/auth';
import Vehicle from './pages/Vehicle';
import Driver from './pages/Drivers';
import TeamManagement from './pages/Team';
import Trips from './pages/Trips';
import FleetsPage from './pages/Fleet';


function PrivateRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<div>Welcome to admin</div>} />
          <Route
            path="fleets"
            element={
              <PrivateRoute>
                <FleetsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="trips"
            element={
              <PrivateRoute>
                <Trips />
              </PrivateRoute>
            }
          />
          <Route
            path="vehicles"
            element={
              <PrivateRoute>
                <Vehicle />
              </PrivateRoute>
            }
          />
          <Route
            path="drivers"
            element={
              <PrivateRoute>
                <Driver />
              </PrivateRoute>
            }
          />
          <Route
            path="team-management"
            element={
              <PrivateRoute>
                <TeamManagement />
              </PrivateRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}