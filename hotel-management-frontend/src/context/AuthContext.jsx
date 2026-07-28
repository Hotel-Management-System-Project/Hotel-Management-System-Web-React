import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import { endpoints } from "../services/api";

const AuthContext = createContext(null);

function claims(token) {
  try {
    return JSON.parse(
      atob(
        token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );
  } catch {
    return {};
  }
}

function saved() {
  try {
    const user = JSON.parse(
      localStorage.getItem("hotel_user")
    );

    if (!user) {
      return null;
    }

    return {
      ...user,
      userId:
        claims(
          localStorage.getItem("hotel_token") || ""
        ).userId ?? user.userId,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(saved);

  const login = async (credentials) => {
    const data = await endpoints.login(credentials);

    const next = {
      email: data.email,
      role: data.role,
      userId: claims(data.token).userId,
    };

    localStorage.setItem(
      "hotel_token",
      data.token
    );

    localStorage.setItem(
      "hotel_user",
      JSON.stringify(next)
    );

    setUser(next);

    return next;
  };

  const logout = () => {
    localStorage.removeItem("hotel_token");
    localStorage.removeItem("hotel_user");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAdmin: user?.role === "ADMIN",
      isOwner: user?.role === "HOTEL_OWNER",
      isCustomer: user?.role === "CUSTOMER",
    }),
    [user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);