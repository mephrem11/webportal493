import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle, XCircle } from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import { getPasswordRuleState, isPasswordCompliant, PASSWORD_RULE_TEXTS } from "../utils/passwordRules";

export function ChangePassword() {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const ruleState = useMemo(() => getPasswordRuleState(newPassword), [newPassword]);
  const strongEnough = isPasswordCompliant(newPassword);
  const matches = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user?.email) {
      setError("No active user session.");
      return;
    }

    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }

    if (!strongEnough) {
      setError("New password does not meet all required rules.");
      return;
    }

    if (!matches) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      const updateInCollection = (key: string) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const list = JSON.parse(raw) as Array<Record<string, string>>;
        const updated = list.map((item) =>
          item.email?.toLowerCase() === user.email.toLowerCase()
            ? { ...item, password: newPassword }
            : item
        );
        localStorage.setItem(key, JSON.stringify(updated));
      };

      updateInCollection("user_accounts");
      updateInCollection("mock_users");
      setSuccess(true);
    } catch {
      setError("Failed to update password. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#E8E3DC] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <CheckCircle size={42} className="mx-auto text-green-600 mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Password Updated</h1>
          <p className="text-gray-600 mb-6">Your password has been changed successfully.</p>
          <button
            onClick={() => navigate("/portal")}
            className="w-full bg-[#2E7D5E] hover:bg-[#266B50] text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8E3DC]">
      <div className="max-w-xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/portal")}
          className="flex items-center gap-2 text-[#2E7D5E] hover:text-[#246B4E] mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back to Portal
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-2">
            <Lock size={18} className="text-[#2E7D5E]" />
            <h1 className="text-xl font-bold text-gray-900">Change Password</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={user?.email || ""}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.slice(0, 10))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent"
                required
              />
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
                {(
                  [
                    { met: ruleState.hasLength, text: PASSWORD_RULE_TEXTS.hasLength },
                    { met: ruleState.hasUppercase, text: PASSWORD_RULE_TEXTS.hasUppercase },
                    { met: ruleState.hasLowercase, text: PASSWORD_RULE_TEXTS.hasLowercase },
                    { met: ruleState.hasDigit, text: PASSWORD_RULE_TEXTS.hasDigit },
                    { met: ruleState.hasSpecial, text: PASSWORD_RULE_TEXTS.hasSpecial },
                    { met: matches, text: "Passwords match" },
                  ] as const
                ).map((rule) => (
                  <div key={rule.text} className={`flex items-center gap-2 text-xs ${rule.met ? "text-green-700" : "text-red-600"}`}>
                    {rule.met ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span>{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full bg-[#2E7D5E] hover:bg-[#266B50] text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
