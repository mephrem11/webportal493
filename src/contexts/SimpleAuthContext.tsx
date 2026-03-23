/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type LoginFn = (email: string, password: string) => Promise<void>;

export type AuthUser = {
  email: string;
  name: string;
  role: "admin" | "charity_partner";
  organization: string;
};

type SimpleAuthContextType = {
  loading: boolean;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCharityPartner: boolean;
  login: LoginFn;
  loginDirect: (userData: AuthUser) => void;
  logout: () => void;
};

const SimpleAuthContext = createContext<SimpleAuthContextType | null>(null);

const DEMO_USERS: Record<string, string> = {
  "partner@charity.org": "partner123",
  "admin@goodsrecycling.org": "admin123",
};

type DemoProfile = {
  role: "admin" | "charity_partner";
  name: string;
  organization: string;
};

const DEMO_PROFILES: Record<string, DemoProfile> = {
  "partner@charity.org": {
    role: "charity_partner",
    name: "Partner User",
    organization: "Hope Community Services",
  },
  "admin@goodsrecycling.org": {
    role: "admin",
    name: "Staff Administrator",
    organization: "Goods Recycling",
  },
};

function readSessionFromStorage(): AuthUser | null {
  try {
    const session = localStorage.getItem("user_session");
    if (session) return JSON.parse(session) as AuthUser;
  } catch { /* ignore */ }
  return null;
}

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(readSessionFromStorage);

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === "admin";
  const isCharityPartner = user?.role === "charity_partner";

  const logout = () => {
    localStorage.removeItem("user_session");
    localStorage.removeItem("current_user");
    localStorage.removeItem("userEmail");
    setUser(null);
  };

  const login: LoginFn = async (email, password) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoading(false);

    const normalized = email.trim().toLowerCase();

    // Check demo users first
    const demoPassword = DEMO_USERS[normalized];
    if (demoPassword && demoPassword === password) {
      const profile = DEMO_PROFILES[normalized];
      const sessionData: AuthUser = {
        email: normalized,
        role: profile.role,
        name: profile.name,
        organization: profile.organization,
      };
      localStorage.setItem("user_session", JSON.stringify(sessionData));
      localStorage.setItem("current_user", JSON.stringify(sessionData));
      localStorage.setItem("userEmail", normalized);
      setUser(sessionData);
      return;
    }

    // Check invited staff members (created from Staff Dashboard)
    const staffMembersRaw = localStorage.getItem("staff_members");
    if (staffMembersRaw) {
      const staffMembers: Array<{ email: string; password?: string; name?: string; role?: string }> =
        JSON.parse(staffMembersRaw);
      const staffMember = staffMembers.find((m) => m.email.toLowerCase() === normalized);

      if (staffMember) {
        const staffSecurityRaw = localStorage.getItem("staff_security");
        const staffSecurity = staffSecurityRaw
          ? (JSON.parse(staffSecurityRaw) as Array<{ email: string; password?: string }>)
          : [];
        const changedPassword = staffSecurity.find((entry) => entry.email.toLowerCase() === normalized)?.password;
        const expectedPassword = (changedPassword || staffMember.password || "admin123").trim();

        if (expectedPassword === password) {
          const sessionData: AuthUser = {
            email: staffMember.email,
            role: "admin",
            name: staffMember.name || "Staff Member",
            organization: "Goods Recycling",
          };
          localStorage.setItem("user_session", JSON.stringify(sessionData));
          localStorage.setItem("current_user", JSON.stringify(sessionData));
          localStorage.setItem("userEmail", staffMember.email);
          setUser(sessionData);
          return;
        }
      }
    }

    // Check dynamically created accounts in localStorage
    const mockUsersRaw = localStorage.getItem("mock_users");
    if (mockUsersRaw) {
      const mockUsers: Array<{ email: string; password: string; name: string; role: string; organization: string }> =
        JSON.parse(mockUsersRaw);
      const found = mockUsers.find(
        (u) => u.email.toLowerCase() === normalized && u.password === password
      );
      if (found) {
        const sessionData: AuthUser = {
          email: found.email,
          role: (found.role === "admin" ? "admin" : "charity_partner") as "admin" | "charity_partner",
          name: found.name,
          organization: found.organization ?? "Goods Recycling",
        };
        localStorage.setItem("user_session", JSON.stringify(sessionData));
        localStorage.setItem("current_user", JSON.stringify(sessionData));
        localStorage.setItem("userEmail", found.email);
        setUser(sessionData);
        return;
      }
    }

    // Check user_accounts (from registration)
    const userAccountsRaw = localStorage.getItem("user_accounts");
    if (userAccountsRaw) {
      const accounts: Array<{ email: string; password: string; name: string; role: string; organization: string; status: string }> =
        JSON.parse(userAccountsRaw);
      const found = accounts.find(
        (u) => u.email.toLowerCase() === normalized && u.password === password
      );
      if (found) {
        if (found.status === "pending_approval") {
          throw new Error("Your account is pending approval by staff.");
        }
        const sessionData: AuthUser = {
          email: found.email,
          role: (found.role === "admin" ? "admin" : "charity_partner") as "admin" | "charity_partner",
          name: found.name,
          organization: found.organization ?? "",
        };
        localStorage.setItem("user_session", JSON.stringify(sessionData));
        localStorage.setItem("current_user", JSON.stringify(sessionData));
        localStorage.setItem("userEmail", found.email);
        setUser(sessionData);
        return;
      }
    }

    throw new Error("Invalid email or password.");
  };

  const loginDirect = (userData: AuthUser) => {
    localStorage.setItem("user_session", JSON.stringify(userData));
    localStorage.setItem("current_user", JSON.stringify(userData));
    localStorage.setItem("userEmail", userData.email);
    setUser(userData);
  };

  const value = { loading, user, isAuthenticated, isAdmin, isCharityPartner, login, loginDirect, logout };

  return <SimpleAuthContext.Provider value={value}>{children}</SimpleAuthContext.Provider>;
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);

  if (!context) {
    throw new Error("useSimpleAuth must be used inside SimpleAuthProvider");
  }

  return context;
}
