// import { useEffect, type ReactNode } from 'react';
// import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';

// import LoginPage from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import { isAuthenticated } from './utils/auth';
// import Vehicle from './pages/Vehicle';
// import Driver from './pages/Drivers';
// import TeamManagement from './pages/Team';
// import Trips from './pages/Trips';
// import TripDetails from './pages/TripDetails';
// import AdminHome from './pages/AdminHome';
// import FleetsPage from './pages/Fleet';
// import FleetDetails from './pages/FleetDetails';
// import FleetCreateHub from './components/fleet/Details/Hubs/FleetCreateHub';
// import FleetHubDetails from './components/fleet/Details/Hubs/FleetHubDetails';
// import DriverCheckins from './pages/DriverCheckins';
// import DriverCheckinDetail from './components/DriverCheckins/DriverCheckinDetail';
// import PaymentPricing from './pages/PaymentPricing';
// import DriverCheckoutHistory from './pages/DriverCheckoutHistory';
// import DriverPreferencesPage from './pages/DriverPreferences';
// import CreateRide from './pages/createRide';
// import Client from './pages/Client';
// import ClientDetails from './pages/ClientDetails';
// import { initAnalytics, trackPageView } from './utils/analytics';
// import Terms from './pages/legal/Terms';
// import PrivacyPolicy from './pages/legal/PrivacyPolicy';
// import DataProtection from './pages/legal/DataProtection';


// function PrivateRoute({ children }: { children: ReactNode }) {
//   if (!isAuthenticated()) return <Navigate to="/login" replace />;
//   return children;
// }

// function AnalyticsListener() {
//   const location = useLocation();

//   useEffect(() => {
//     initAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID);
//   }, []);

//   useEffect(() => {
//     trackPageView(`${location.pathname}${location.search}`);
//   }, [location.pathname, location.search]);

//   return null;
// }

// function PublicRoute({ children }: { children: ReactNode }) {
//   if (isAuthenticated()) return <Navigate to="/admin" replace />;
//   return children;
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Toaster position="top-right" />
//       <AnalyticsListener />

//       <Routes>
//         <Route
//           path="/"
//           element={<Navigate to={isAuthenticated() ? "/admin" : "/login"} replace />}
//         />
//         <Route
//           path="/login"
//           element={
//             <PublicRoute>
//               <LoginPage />
//             </PublicRoute>
//           }
//         />
//         <Route path="/create-ride" element={<CreateRide />} />
//         <Route path="/terms" element={<Terms />} />
//         <Route path="/privacy-policy" element={<PrivacyPolicy />} />
//         <Route path="/data-protection" element={<DataProtection />} />
        

//         <Route
//           path="/admin"
//           element={
//             <PrivateRoute>
//               <Dashboard />
//             </PrivateRoute>
//           }
//         >
//           <Route
//             index
//             element={
//               <PrivateRoute>
//                 <AdminHome />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="fleets"
//             element={
//               <PrivateRoute>
//                 <FleetsPage />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="trips"
//             element={
//               <PrivateRoute>
//                 <Trips />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="trips/:id"
//             element={
//               <PrivateRoute>
//                 <TripDetails />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="vehicles"
//             element={
//               <PrivateRoute>
//                 <Vehicle />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="drivers"
//             element={
//               <PrivateRoute>
//                 <Driver />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="team-management"
//             element={
//               <PrivateRoute>
//                 <TeamManagement />
//               </PrivateRoute>
//             }
//           />
//           <Route 
//             path="driver-checkins"
//             element={
//               <PrivateRoute>
//                 <DriverCheckins />
//               </PrivateRoute>
//             }
//           />
//           <Route 
//             path="driver-checkins/:id"
//             element={
//               <PrivateRoute>
//                 <DriverCheckinDetail />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="driver-checkouts/:driverId"
//             element={
//               <PrivateRoute>
//                 <DriverCheckoutHistory />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="payment"
//             element={
//               <PrivateRoute>
//                 <PaymentPricing />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="driver-preferences"
//             element={
//               <PrivateRoute>
//                 <DriverPreferencesPage />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="client"
//             element={
//               <PrivateRoute>
//                 <Client />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="client/:clientId"
//             element={
//               <PrivateRoute>
//                 <ClientDetails />
//               </PrivateRoute>
//             }
//           />
//           <Route path="fleets/:id" element={
//           <PrivateRoute>
//             <FleetDetails />
//           </PrivateRoute>
//         } />
//         <Route path="fleets/:id/hubs/create" element={
//           <PrivateRoute>
//             <FleetCreateHub  />
//           </PrivateRoute>
//         } />
        
//         <Route path="fleets/:id/hubs/:hubId" element={
//           <PrivateRoute>
//             <FleetHubDetails />
//           </PrivateRoute>
//           } 
//         />
//         </Route>

//         <Route
//           path="*"
//           element={<Navigate to={isAuthenticated() ? "/admin" : "/login"} replace />}
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// }


import { useEffect, type ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
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
import DriverCheckoutHistory from './pages/DriverCheckoutHistory';
import DriverPreferencesPage from './pages/DriverPreferences';
import CreateRide from './pages/createRide';
import Client from './pages/Client';
import ClientDetails from './pages/ClientDetails';

import Terms from './pages/legal/Terms';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import DataProtection from './pages/legal/DataProtection';

import Footer from './components/layout/Footer';

import { initAnalytics, trackPageView } from './utils/analytics';

/* ---------------- Route Guards ---------------- */

function PrivateRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }: { children: ReactNode }) {
  if (isAuthenticated()) return <Navigate to="/admin" replace />;
  return children;
}

/* ---------------- Analytics ---------------- */

function AnalyticsListener() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID);
  }, []);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

/* ---------------- App ---------------- */

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AnalyticsListener />

      {/* Global Layout */}
      <div className="min-h-screen flex flex-col">
        {/* Main Content */}
        <div className="flex-1">
          <Routes>
            {/* Root */}
            <Route
              path="/"
              element={
                <Navigate
                  to={isAuthenticated() ? '/admin' : '/login'}
                  replace
                />
              }
            />

            {/* Auth */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Public Pages */}
            <Route path="/create-ride" element={<CreateRide />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/data-protection" element={<DataProtection />} />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            >
              <Route index element={<AdminHome />} />
              <Route path="fleets" element={<FleetsPage />} />
              <Route path="fleets/:id" element={<FleetDetails />} />
              <Route
                path="fleets/:id/hubs/create"
                element={<FleetCreateHub />}
              />
              <Route
                path="fleets/:id/hubs/:hubId"
                element={<FleetHubDetails />}
              />
              <Route path="trips" element={<Trips />} />
              <Route path="trips/:id" element={<TripDetails />} />
              <Route path="vehicles" element={<Vehicle />} />
              <Route path="drivers" element={<Driver />} />
              <Route path="team-management" element={<TeamManagement />} />
              <Route path="driver-checkins" element={<DriverCheckins />} />
              <Route
                path="driver-checkins/:id"
                element={<DriverCheckinDetail />}
              />
              <Route
                path="driver-checkouts/:driverId"
                element={<DriverCheckoutHistory />}
              />
              <Route path="payment" element={<PaymentPricing />} />
              <Route
                path="driver-preferences"
                element={<DriverPreferencesPage />}
              />
              <Route path="client" element={<Client />} />
              <Route path="client/:clientId" element={<ClientDetails />} />
            </Route>

            {/* Fallback */}
            <Route
              path="*"
              element={
                <Navigate
                  to={isAuthenticated() ? '/admin' : '/login'}
                  replace
                />
              }
            />
          </Routes>
        </div>

        {/* Global Footer (Legal Links Always Visible) */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}
