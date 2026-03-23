/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiRequest } from "../utils/supabase";

interface User {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
  role: "donor" | "charity_partner" | "admin";
  organization?: string;
}

interface Auth0ContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  isConfigured: boolean;
  loginWithAuth0: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  isCharityPartner: boolean;
}

const Auth0Context = createContext<Auth0ContextType | undefined>(undefined);

let AUTH0_DOMAIN = "YOUR_AUTH0_DOMAIN.us.auth0.com";
let AUTH0_CLIENT_ID = "YOUR_AUTH0_CLIENT_ID";
let AUTH0_AUDIENCE = "https://api.goodsrecycling.org";

if (import.meta.env.VITE_AUTH0_DOMAIN) {
  AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
}
if (import.meta.env.VITE_AUTH0_CLIENT_ID) {
  AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
}
if (import.meta.env.VITE_AUTH0_AUDIENCE) {
  AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;
}

const AUTH0_REDIRECT_URI =
  typeof window !== "undefined" ? `${window.location.origin}/callback` : "";

function generateRandomString() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isPlaceholderValue(value: string): boolean {
  return value.includes("YOUR_AUTH0_");
}

function isAuth0Configured(): boolean {
  return Boolean(
    AUTH0_DOMAIN
      && AUTH0_CLIENT_ID
      && !isPlaceholderValue(AUTH0_DOMAIN)
      && !isPlaceholderValue(AUTH0_CLIENT_ID)
  );
}

export function Auth0Provider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isAuth0Configured();

  useEffect(() => {
    async function checkSession() {
      try {
        if (!configured) {
          return;
        }

        const storedToken = localStorage.getItem("auth0_token");
        if (!storedToken) {
          return;
        }

        const result = (await apiRequest("/auth/session", {}, storedToken)) as {
          success?: boolean;
          user?: User;
        };

        if (result.success && result.user) {
          setUser(result.user);
          setAccessToken(storedToken);
          return;
        }

        localStorage.removeItem("auth0_token");
        setUser(null);
        setAccessToken(null);
      } catch {
        localStorage.removeItem("auth0_token");
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    }

    void checkSession();
  }, [configured]);

  useEffect(() => {
    async function handleCallback() {
      if (window.location.pathname !== "/callback") {
        return;
      }

      if (!configured) {
        window.location.href = "/login?error=auth0_not_configured";
        return;
      }

      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const token = params.get("access_token");
        const idToken = params.get("id_token");
        const state = params.get("state");
        const authError = params.get("error");

        if (authError) {
          window.location.href = `/login?error=${encodeURIComponent(authError)}`;
          return;
        }

        const storedState = sessionStorage.getItem("auth0_state");
        if (state !== storedState) {
          window.location.href = "/login?error=state_mismatch";
          return;
        }
        sessionStorage.removeItem("auth0_state");

        if (!token || !idToken) {
          throw new Error("No tokens received from Auth0");
        }

        localStorage.setItem("auth0_token", token);
        setAccessToken(token);

        const result = (await apiRequest("/auth/session", {}, token)) as {
          success?: boolean;
          user?: User;
          error?: string;
        };

        if (!result.success || !result.user) {
          throw new Error(result.error || "Failed to sync user");
        }

        setUser(result.user);
        const redirectPath = result.user.role === "charity_partner" ? "/portal" : "/";
        window.location.href = redirectPath;
      } catch {
        window.location.href = "/login?error=auth_failed";
      }
    }

    void handleCallback();
  }, [configured]);

  function loginWithAuth0() {
    if (!configured) {
      return;
    }

    const state = generateRandomString();
    const nonce = generateRandomString();
    sessionStorage.setItem("auth0_state", state);

    const params = new URLSearchParams({
      client_id: AUTH0_CLIENT_ID,
      redirect_uri: AUTH0_REDIRECT_URI,
      response_type: "token id_token",
      scope: "openid profile email",
      audience: AUTH0_AUDIENCE,
      state,
      nonce,
    });

    window.location.href = `https://${AUTH0_DOMAIN}/authorize?${params.toString()}`;
  }

  function logout() {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("auth0_token");

    const params = new URLSearchParams({
      client_id: AUTH0_CLIENT_ID,
      returnTo: window.location.origin,
    });

    window.location.href = `https://${AUTH0_DOMAIN}/v2/logout?${params.toString()}`;
  }

  const value: Auth0ContextType = {
    user,
    accessToken,
    loading,
    isConfigured: configured,
    loginWithAuth0,
    logout,
    isAuthenticated: !!user,
    isCharityPartner: user?.role === "charity_partner",
  };

  return <Auth0Context.Provider value={value}>{children}</Auth0Context.Provider>;
}

export function useAuth0() {
  const context = useContext(Auth0Context);
  if (context === undefined) {
    throw new Error("useAuth0 must be used within an Auth0Provider");
  }
  return context;
}
