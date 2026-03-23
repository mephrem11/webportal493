import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import { useAuth0 } from "../contexts/Auth0Context";
import goodsRecyclingLogo from "../assets/logo.svg";

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

function requiresPartnerSetup(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  try {
    const accounts = JSON.parse(localStorage.getItem("user_accounts") || "[]") as Array<{
      email: string;
      status?: string;
      forcePasswordReset?: boolean;
      mustChangePassword?: boolean;
      securityQ1?: string;
      securityQ2?: string;
    }>;
    const account = accounts.find((a) => a.email.toLowerCase() === normalized);
    if (!account || account.status !== "active") return false;
    const needsPasswordReset = Boolean(account.forcePasswordReset || account.mustChangePassword);
    const missingSecurity = !String(account.securityQ1 || "").trim() || !String(account.securityQ2 || "").trim();
    return needsPasswordReset || missingSecurity;
  } catch {
    return false;
  }
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
          } else if (user.email && requiresPartnerSetup(user.email)) {
            navigate("/password-change", { state: { email: user.email } });
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
    <div className="flex min-h-screen flex-col bg-[#E7E3DC]">
      {/* Top-left logo */}
      <div className="px-6 pt-5 sm:px-10">
        <img src={goodsRecyclingLogo} alt="Goods Recycling" style={{ height: '180px', width: 'auto' }} />
      </div>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-8 sm:px-6">
      <section className="relative w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-100/40 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-100/60 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-28 w-28 rounded-full bg-cyan-100/70 blur-xl" />

        <div className="relative mb-6">
          <p className="mb-2 text-base font-semibold uppercase tracking-[0.24em] text-emerald-700 sm:text-lg">
            Charity Portal
          </p>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl" style={{ fontFamily: "Playfair Display, serif" }}>
            Sign In
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#2E7D5E]">Email</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#2E7D5E]">Password</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]"
                placeholder="........"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-6 py-3.5 font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: '#000000' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111111')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#000000')}
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
          <div className="mt-5 flex justify-center">
            <img src={goodsRecyclingLogo} alt="Goods Recycling" style={{ height: '200px', width: 'auto' }} />
          </div>
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
      </div>

      <footer className="py-6 text-center text-xs text-gray-600">
        <p>© 2026 GoodsRecycling.com</p>
      </footer>
    </div>
  );
}
