import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import { getPasswordRuleState, PASSWORD_RULE_TEXTS } from "../utils/passwordRules";

export function PasswordChangePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? "";
  const emailFromSession = (() => {
    try {
      const session = localStorage.getItem("user_session");
      return session ? (JSON.parse(session) as { email?: string }).email ?? "" : "";
    } catch {
      return "";
    }
  })();
  const email = emailFromState || emailFromSession;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [securityQ1, setSecurityQ1] = useState("");
  const [securityQ2, setSecurityQ2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const ruleState = getPasswordRuleState(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const rules = [
    { met: ruleState.hasLength, text: PASSWORD_RULE_TEXTS.hasLength },
    { met: ruleState.hasUppercase, text: PASSWORD_RULE_TEXTS.hasUppercase },
    { met: ruleState.hasLowercase, text: PASSWORD_RULE_TEXTS.hasLowercase },
    { met: ruleState.hasDigit, text: PASSWORD_RULE_TEXTS.hasDigit },
    { met: ruleState.hasSpecial, text: PASSWORD_RULE_TEXTS.hasSpecial },
    { met: passwordsMatch, text: "Passwords match" },
  ];

  const hasSecurityAnswers = securityQ1.trim().length > 0 && securityQ2.trim().length > 0;
  const isValid = rules.every((r) => r.met) && hasSecurityAnswers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!rules.every((r) => r.met)) {
      setError("Please meet all password requirements.");
      return;
    }

    if (!hasSecurityAnswers) {
      setError("Please answer both security questions.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    // Verify current password
    const accounts: { email: string; password: string }[] = JSON.parse(
      localStorage.getItem("user_accounts") || "[]"
    );
    const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (account && account.password !== currentPassword) {
      setError("Current password is incorrect.");
      setLoading(false);
      return;
    }

    // Update password
    const updated = accounts.map((a) =>
      a.email.toLowerCase() === email.toLowerCase()
        ? {
            ...a,
            password: newPassword,
            securityQ1: securityQ1.trim(),
            securityQ2: securityQ2.trim(),
            forcePasswordReset: false,
            mustChangePassword: false,
          }
        : a
    );
    localStorage.setItem("user_accounts", JSON.stringify(updated));

    // Keep mock_users in sync for staff-side views.
    try {
      const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]") as Array<Record<string, unknown>>;
      const updatedUsers = mockUsers.map((u) =>
        String(u.email || "").toLowerCase() === email.toLowerCase()
          ? {
              ...u,
              password: newPassword,
              securityQ1: securityQ1.trim(),
              securityQ2: securityQ2.trim(),
              forcePasswordReset: false,
              mustChangePassword: false,
            }
          : u
      );
      localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
    } catch {
      // ignore mock user sync failures
    }

    // Update session
    const session = localStorage.getItem("user_session");
    if (session) {
      try {
        const parsed = JSON.parse(session) as Record<string, unknown>;
        parsed.passwordChanged = true;
        localStorage.setItem("user_session", JSON.stringify(parsed));
      } catch {
        // ignore
      }
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => navigate("/portal"), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h2>
          <p className="text-gray-600">Redirecting you to the portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
        <div className="bg-gradient-to-r from-[#00D084] to-[#00C878] px-8 py-6 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Change Password</h1>
          {email && <p className="text-white/80 text-sm mt-1">{email}</p>}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.slice(0, 10))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What city were you born in? *
            </label>
            <input
              type="text"
              required
              value={securityQ1}
              onChange={(e) => setSecurityQ1(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What is your favorite hobby? *
            </label>
            <input
              type="text"
              required
              value={securityQ2}
              onChange={(e) => setSecurityQ2(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            />
          </div>

          {/* Password rules */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-1.5">
            {rules.map((rule) => (
              <div key={rule.text} className={`flex items-center gap-2 text-sm ${rule.met ? "text-green-700" : "text-red-600"}`}>
                {rule.met ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>{rule.text}</span>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock size={18} />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
