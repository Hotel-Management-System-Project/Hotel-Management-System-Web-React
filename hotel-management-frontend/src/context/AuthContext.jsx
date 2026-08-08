/**
 * Keeps authentication data in one global context. Its functions restore JWT
 * sessions, perform login/logout, normalize roles, and expose role checks.
 */
import { useMemo, useState } from "react";
import { endpoints } from "../services/api";
import { AuthContext } from "./authStore";

const TOKEN_KEY = "hotel_token";
const USER_KEY = "hotel_user";
const SELECTED_HOTEL_KEY = "selected_hotel";
const SESSION_VERSION_KEY = "hotel_session_version";
const SESSION_VERSION = "3";

// A JWT contains user information in its middle section (the payload).
function readTokenClaims(token) {
  try {
    const value = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = value.padEnd(
      value.length + ((4 - (value.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}
// Restore the login when the browser is refreshed.
function getSavedUser() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = JSON.parse(localStorage.getItem(USER_KEY));
    const savedVersion = localStorage.getItem(SESSION_VERSION_KEY);

    const claims = readTokenClaims(token || "");
    const tokenExpired = !claims.exp || claims.exp * 1000 <= Date.now();

    if (
      !savedUser ||
      !token ||
      tokenExpired ||
      savedVersion !== SESSION_VERSION
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SELECTED_HOTEL_KEY);
      localStorage.removeItem(SESSION_VERSION_KEY);
      return null;
    }

    const tokenRole = normalizeRole(claims.role);
    const tokenEmail = claims.sub;

    // The signed JWT is the source of truth. Never display an owner session
    // from stale local user data while sending a customer/admin JWT.
    if (!tokenRole || !tokenEmail) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SELECTED_HOTEL_KEY);
      localStorage.removeItem(SESSION_VERSION_KEY);
      return null;
    }

    return {
      ...savedUser,
      email: tokenEmail,
      role: tokenRole,
      userId: claims.userId ?? savedUser.userId,
    };
  } catch {
    return null;
  }
}

function normalizeRole(role) {
  // Spring Security may return ROLE_ADMIN; the UI uses the simpler ADMIN form.
  return String(role || "").replace(/^ROLE_/, "");
}

export function AuthProvider({ children }) {
  // Passing a function to useState reads localStorage only on the first render.
  const [user, setUser] = useState(getSavedUser);

  // Authenticate, decode the user ID, and persist the successful session.
  const login = async (credentials) => {
    const data = await endpoints.login(credentials);
    const claims = readTokenClaims(data.token);

    const loggedInUser = {
      email: claims.sub || data.email,
      role: normalizeRole(claims.role || data.role),
      userId: claims.userId,
    };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    localStorage.setItem(SESSION_VERSION_KEY, SESSION_VERSION);
    setUser(loggedInUser);

    return loggedInUser;
  };

  // Clear every user-specific value so the next login starts cleanly.
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SELECTED_HOTEL_KEY);
    localStorage.removeItem(SESSION_VERSION_KEY);
    setUser(null);
  };

  // Keep the shared object stable until the authenticated user changes.
  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAdmin: user?.role === "ADMIN",
      isOwner: user?.role === "HOTEL_OWNER",
      isCustomer: user?.role === "CUSTOMER",
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
