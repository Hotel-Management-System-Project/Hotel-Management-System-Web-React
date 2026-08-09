/**
 * Defines the application's public and protected routes. Keeping route rules in
 * one file makes navigation and role permissions easy to understand and change.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards";
import Bookings from "./pages/Bookings";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Hotels from "./pages/Hotels";
import Login from "./pages/Login";
import Rooms from "./pages/Rooms";
import SalesReports from "./pages/SalesReports";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import Users from "./pages/Users";

export default function App() {
  return (
    // Catch errors from every route below and show a recovery screen.
    <AppErrorBoundary>
      <Routes>
        {/* Pages that anyone can open */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PublicOnlyRoute>
              <Login portal="admin" />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />

        {/* Pages inside the authenticated dashboard layout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/reports" element={<SalesReports />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppErrorBoundary>
  );
}
