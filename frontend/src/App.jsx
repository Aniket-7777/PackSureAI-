import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/home";
import Login from "./pages/login";
import DashboardLayout from "./layouts/dashboardlayout";

import Dashboard from "./pages/dashboard";
import NewInspection from "./pages/NewInspection";
import ScanProduct from "./pages/scanproduct";
import ScanResult from "./pages/scanresult";
import Report from "./pages/Report";

import Inspections from "./pages/inspections";
import Products from "./pages/products";
import Rules from "./pages/rules";
import Users from "./pages/users";
import Settings from "./pages/settings";
import Notifications from "./pages/notifications";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />


        {/* APPLICATION */}

        <Route element={<DashboardLayout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/new-inspection"
            element={<NewInspection />}
          />

          <Route
            path="/scan"
            element={<ScanProduct />}
          />

          <Route
            path="/scan-result"
            element={<ScanResult />}
          />

          <Route
            path="/report"
            element={<Report />}
          />

          <Route
            path="/reports"
            element={<Report />}
          />

          <Route
            path="/inspections"
            element={<Inspections />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/rules"
            element={<Rules />}
          />

          <Route
            path="/users"
            element={<Users />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>


        {/* FALLBACK */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}