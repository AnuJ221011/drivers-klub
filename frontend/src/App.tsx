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
import TripDetails from './pages/TripDetails';
import AdminHome from './pages/AdminHome';
import FleetsPage from './pages/Fleet';
import FleetDetails from './pages/FleetDetails';
import FleetCreateHub from './components/fleet/Details/Hubs/FleetCreateHub';
import FleetHubDetails from './components/fleet/Details/Hubs/FleetHubDetails';
import DriverCheckins from './pages/DriverCheckins';
import DriverCheckinDetail from './components/DriverCheckins/DriverCheckinDetail';
import PaymentPricing from './pages/PaymentPricing';


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
          <Route
            index
            element={
              <PrivateRoute>
                <AdminHome />
              </PrivateRoute>
            }
          />
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
            path="trips/:id"
            element={
              <PrivateRoute>
                <TripDetails />
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
          <Route 
            path="driver-checkins"
            element={
              <PrivateRoute>
                <DriverCheckins />
              </PrivateRoute>
            }
          />
          <Route 
            path="driver-checkins/:id"
            element={
              <PrivateRoute>
                <DriverCheckinDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="payment"
            element={
              <PrivateRoute>
                <PaymentPricing />
              </PrivateRoute>
            }
          />
          <Route path="fleets/:id" element={
          <PrivateRoute>
            <FleetDetails />
          </PrivateRoute>
        } />
        <Route path="fleets/:id/hubs/create" element={
          <PrivateRoute>
            <FleetCreateHub  />
          </PrivateRoute>
        } />
        
        <Route path="fleets/:id/hubs/:hubId" element={
          <PrivateRoute>
            <FleetHubDetails />
          </PrivateRoute>
          } 
        />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}