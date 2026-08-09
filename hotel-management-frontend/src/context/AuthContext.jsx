/**
 * Keeps authentication data in one global context. Its functions restore JWT
 * sessions, perform login/logout, normalize roles, and expose role checks.
 */
import { useEffect, useMemo, useState } from "react";
import { endpoints } from "../services/api";
import { AuthContext } from "./authStore";

const TOKEN_KEY = "hotel_token";
const USER_KEY = "hotel_user";
const SELECTED_HOTEL_KEY = "selected_hotel";
const SESSION_VERSION_KEY = "hotel_session_version";
// Increment this whenever the accepted JWT role rules change. It makes old
// browser sessions sign in again instead of sending an obsolete role token to
// protected owner APIs.
const SESSION_VERSION = "5";
const SUPPORTED_ROLES = new Set(["ADMIN", "HOTEL_OWNER", "CUSTOMER"]);

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
    // A token created by an older build can contain a legacy role such as
    // OWNER. Spring only accepts HOTEL_OWNER, so retaining that session would
    // result in a confusing 403 when the owner edits a room.
    if (!SUPPORTED_ROLES.has(tokenRole) || !tokenEmail) {
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

  // Fast Refresh preserves React state while source files change. Check the
  // version after every refreshed mount so an open development tab cannot keep
  // using an older JWT role session until the browser is manually reloaded.
  useEffect(() => {
    if (
      user &&
      localStorage.getItem(SESSION_VERSION_KEY) !== SESSION_VERSION
    ) {
      const logoutTimer = window.setTimeout(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(SELECTED_HOTEL_KEY);
        localStorage.removeItem(SESSION_VERSION_KEY);
        setUser(null);
      }, 0);

      return () => window.clearTimeout(logoutTimer);
    }

    return undefined;
  }, [user]);

  // Authenticate, decode the user ID, and persist the successful session.
  const login = async (credentials, expectedRole) => {
    const data = await endpoints.login(credentials);
    const claims = readTokenClaims(data.token);
    const role = normalizeRole(claims.role || data.role);
    const requiredRole = normalizeRole(expectedRole);

    // Do this before persisting anything. A successful backend login must not
    // create a browser session in the wrong portal.
    if (requiredRole && role !== requiredRole) {
      const portalName =
        requiredRole === "ADMIN" ? "administrator" : "hotel owner";
      throw new Error(
        `This sign-in is reserved for ${portalName} accounts.`,
      );
    }

    const loggedInUser = {
      email: claims.sub || data.email,
      role,
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
