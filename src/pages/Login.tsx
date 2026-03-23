import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import { useAuth0 } from "../contexts/Auth0Context";
import goodsRecyclingLogo from "../assets/logo.svg";
import { PublicTabs } from "../components/PublicTabs";

function getPartnerStatus(email: string): "pending" | "active" | "suspended" | null {
  const normalized = email.trim().toLowerCase();
  try {
    const accounts = JSON.parse(localStorage.getItem("user_accounts") || "[]") as Array<{ email: string; status?: string }>;
    const account = accounts.find((a) => a.email.toLowerCase() === normalized);
    if (account?.status === "pending" || account?.status === "active" || account?.status === "suspended") {
      return account.status;
    }
  } catch { /* ignore */ }
  try {
    const users = JSON.parse(localStorage.getItem("mock_users") || "[]") as Array<{ email: string; status?: string }>;
    const user = users.find((u) => u.email.toLowerCase() === normalized);
    if (user?.status === "pending" || user?.status === "active" || user?.status === "suspended") {
      return user.status;
    }
  } catch { /* ignore */ }
  return null;
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useSimpleAuth();
  const { loginWithAuth0, isConfigured: isAuth0Configured } = useAuth0();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const userStr = localStorage.getItem("user_session");
      if (userStr) {
        const user = JSON.parse(userStr) as { role?: string; email?: string };
        if (user.role === "admin") {
          navigate("/staff/dashboard");
        } else if (user.role === "charity_partner") {
          const status = user.email ? getPartnerStatus(user.email) : null;
          if (status === "pending" || status === "suspended") {
            navigate("/my-account");
          } else {
            navigate("/portal");
          }
        } else {
          navigate("/");
        }
      } else {
        navigate("/portal");
      }
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <PublicTabs />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:gap-8">
      <section className="w-full rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm lg:w-1/2 lg:p-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl" style={{ fontFamily: "Playfair Display, serif" }}>
            Charity Partner Portal
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">Secure, simple sign-in for charity partners and administrators.</p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            to="/login"
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-center text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Charity Partner Login
          </Link>
          <Link
            to="/staff/login"
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-center text-sm font-semibold text-blue-800 hover:bg-blue-100"
          >
            Administrator Login
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#2E7D5E]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#2E7D5E]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]"
              placeholder="........"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2E5E4E] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#264E40] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="pt-1 text-center">
            <Link to="/forgot-password" className="text-sm text-gray-500 underline hover:text-gray-700">
              Forgot Password?
            </Link>
          </div>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <p className="mb-3 text-center text-sm text-gray-600">Don't have an account?</p>
          <Link
            to="/register"
            className="block w-full rounded-lg bg-gray-100 px-6 py-3 text-center font-semibold text-gray-800 transition-colors hover:bg-gray-200"
          >
            Create Account
          </Link>
        </div>

        {isAuth0Configured && (
          <div className="mt-4">
            <button
              type="button"
              onClick={loginWithAuth0}
              className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-800 transition-colors hover:bg-gray-50"
            >
              Continue with Auth0
            </button>
          </div>
        )}

        <div className="mt-6 p-2 text-center">
          <img
            src={goodsRecyclingLogo}
            alt="Goods Recycling logo"
            className="mx-auto h-24 w-auto"
          />
        </div>
      </section>

      <section className="w-full rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm lg:w-1/2 lg:p-8">
        <h2 className="text-2xl font-bold text-cyan-900">Portal Scope and Release Criteria</h2>
        <p className="mt-3 text-sm leading-7 text-gray-700">
          High-priority product for charity partners to log in, submit requests, edit recurring wish lists, track
          request status, and view weekly delivery schedules while staff and sorting teams manage updates.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-gray-800">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">Smooth login for charity users and administrators</div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">Requests appear in system and can be edited</div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">Role-based access so charities only see their data</div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">Delivery dates and status are viewable through portal tools</div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">Google Sheets syncing remains enabled for operational reporting</div>
        </div>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-900">Hardware Coverage</h3>
          <p className="mt-2 text-sm text-emerald-950">
            Mobile-ready for Android smartphones and optimized for desktop/laptop use by warehouse staff,
            office staff, and charity partners.
          </p>
        </div>
      </section>
      </div>

      <footer className="py-6 text-center text-xs text-gray-600">
        <p>© 2026 GoodsRecycling.com</p>
      </footer>
    </div>
  );
}
