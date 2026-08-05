/**
 * Protects private routes and controls which roles may open them. It also keeps
 * authenticated users away from public-only Login and Signup pages.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Layout from "./Layout";

// Protected pages require a logged-in user.
export function ProtectedRoute() {
  // A missing authenticated user cannot enter the private workspace.
  const { user } = useAuth();
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

// Login and signup should not open after the user has logged in.
export function PublicOnlyRoute({ children }) {
  // Keep logged-in users in their workspace instead of showing Login again.
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}
