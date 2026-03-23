/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getSupabaseClient, apiRequest } from "../utils/supabase";

interface User {
  id: string;
  email: string;
  name: string;
  role: "donor" | "charity_partner";
  organization?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: string,
    organization?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isCharityPartner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          return;
        }

        const result = (await apiRequest("/auth/session", {}, session.access_token)) as {
          user?: User;
        };
        if (result.user) {
          setUser(result.user);
          setAccessToken(session.access_token);
        }
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    }

    void checkSession();
  }, []);

  async function signup(
    email: string,
    password: string,
    name: string,
    role: string,
    organization?: string
  ) {
    const result = (await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role, organization }),
    })) as { success?: boolean };

    if (result.success) {
      await login(email, password);
    }
  }

  async function login(email: string, password: string) {
    const result = (await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })) as { success?: boolean; user?: User; access_token?: string };

    if (result.success && result.user && result.access_token) {
      setUser(result.user);
      setAccessToken(result.access_token);

      const supabase = getSupabaseClient();
      await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.access_token,
      });
    }
  }

  async function logout() {
    try {
      if (accessToken) {
        await apiRequest("/auth/logout", { method: "POST" }, accessToken);
      }
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }

  const value: AuthContextType = {
    user,
    accessToken,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isCharityPartner: user?.role === "charity_partner",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
