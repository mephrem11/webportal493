import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, LogIn } from "lucide-react";
import goodsRecyclingLogo from "../assets/logo.svg";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import type { AuthUser } from "../contexts/SimpleAuthContext";

const STAFF_CREDENTIALS = [
  { email: "admin@goodsrecycling.org", password: "admin123", name: "Admin User", role: "admin" },
  { email: "staff@goodsrecycling.org", password: "staff123", name: "Staff Member", role: "admin" },
];

export function StaffLogin() {
  const navigate = useNavigate();
  const { loginDirect } = useSimpleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const normalizedEmail = email.trim().toLowerCase();
    const enteredPassword = password.trim();
    const isMainAdmin = normalizedEmail === "admin@goodsrecycling.org";

    // Look up any password the user has already set via Password Setup
    const staffSecurityRaw = localStorage.getItem("staff_security");
    const staffSecurity = staffSecurityRaw
      ? (JSON.parse(staffSecurityRaw) as Array<{ email: string; password: string }>)
      : [];
    const changedPassword =
      staffSecurity.find((e) => e.email.toLowerCase() === normalizedEmail)?.password?.trim() ?? null;

    // 1. Check hardcoded staff accounts
    const hardcoded = STAFF_CREDENTIALS.find((c) => c.email.toLowerCase() === normalizedEmail);
    if (hardcoded) {
      const expectedPw = changedPassword ?? hardcoded.password;
      if (enteredPassword === expectedPw) {
        const session: AuthUser = {
          email: hardcoded.email,
          name: hardcoded.name,
          role: "admin",
          organization: "Goods Recycling",
        };
        loginDirect(session);
        // Main admin can always pass through; other staff must complete setup first.
        if (isMainAdmin || changedPassword) {
          navigate("/staff/dashboard");
        } else {
          navigate("/staff/change-password");
        }
        setLoading(false);
        return;
      }
      setError("Incorrect password.");
      setLoading(false);
      return;
    }

    // 2. Check invited staff members
    const staffMembersRaw = localStorage.getItem("staff_members");
    const staffMemberList = staffMembersRaw
      ? (JSON.parse(staffMembersRaw) as Array<{ id: string; email: string; password: string; name: string; role: string }>)
      : [];
    const invitedMember = staffMemberList.find((m) => m.email.toLowerCase() === normalizedEmail);

    if (invitedMember) {
      const expectedPw = (changedPassword ?? invitedMember.password ?? "admin123").trim();
      if (enteredPassword === expectedPw) {
        const session: AuthUser = {
          email: invitedMember.email,
          name: invitedMember.name,
          role: "admin",
          organization: "Goods Recycling",
        };
        loginDirect(session);
        // No changed password yet → send to Password Setup
        if (!changedPassword) {
          navigate("/staff/change-password");
        } else {
          navigate("/staff/dashboard");
        }
        setLoading(false);
        return;
      }
      setError("Incorrect password. If this is your first login, use the temporary password: admin123");
      setLoading(false);
      return;
    }

    setError("No staff account found with that email address.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex flex-col px-4">
      <div className="flex flex-1 items-center justify-center py-8">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-8 py-8 text-center">
          <img
            src={goodsRecyclingLogo}
            alt="Goods Recycling logo"
            className="mx-auto mb-4 h-24 w-auto brightness-0 invert"
          />
          <h1 className="text-2xl font-bold text-white">Staff Portal</h1>
          <p className="text-white/80 text-sm mt-1">Goods Recycling Internal Access</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@goodsrecycling.org"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Sign In to Staff Portal
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Partner?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[#00C853] hover:underline font-medium"
            >
              Go to Partner Login
            </button>
          </p>
        </form>
      </div>
      </div>

      <footer className="py-6 text-center text-xs text-white/80">
        <p>© 2026 GoodsRecycling.com</p>
      </footer>
    </div>
  );
}
