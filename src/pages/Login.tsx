import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import { useAuth0 } from "../contexts/Auth0Context";
import { PublicTabs } from "../components/PublicTabs";

const RELEASE_CRITERIA = [
  "Smooth login for charity users",
  "Requests appear in system",
  "Requests can be edited",
  "Sponsor approves portal usability",
];

const FUNCTIONAL_REQUIREMENTS = [
  "Charity login system",
  "Submit request form",
  "Edit request capability",
  "Request status tracking",
  "Role-based access control (charities only see their data)",
  "Data syncing to Google Sheets",
  "Delivery dates viewable on portal",
  "Strong security practices for web and mobile authentication",
];

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
          <p className="text-sm text-gray-600 sm:text-base">One secure login for both staff administrators and charity partners.</p>
        </div>

        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Use this same login form for both roles. Administrators are redirected to staff dashboard, and charity partners are redirected to the charity portal.
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

      </section>

      <section className="w-full rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm lg:w-1/2 lg:p-8">
        <h2 className="text-2xl font-bold text-cyan-900">Charity Partner Portal Requirements</h2>
        <p className="mt-3 text-sm leading-7 text-gray-700">
          Description: allows charity partners to log in, submit requests for items, and track request status through a web portal.
          Priority: high (highest business value).
        </p>

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">Stimulus / Response Sequence</h3>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            Charity logs in, submits request, system stores request, sorting team views request, request status updates,
            sponsor schedules deliveries, and charities see delivery dates.
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">Feature Release Criteria</h3>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-800">
            {RELEASE_CRITERIA.map((item) => (
              <li key={item} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">Functional Requirements</h3>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-800">
            {FUNCTIONAL_REQUIREMENTS.map((item) => (
              <li key={item} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-900">Software and Coexistence</h3>
          <p className="mt-2 text-sm text-indigo-950">
            Google Sheets and Google Drive are used for storage and reporting, web browsers provide portal access,
            and integration can coexist with eBay platform/API data workflows.
          </p>
          <p className="mt-2 text-sm text-indigo-950">
            The portal structure is component-based so this framework can be reused in other web application solutions.
          </p>
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
