import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import { getPasswordRuleState, isPasswordCompliant, PASSWORD_RULE_TEXTS } from "../utils/passwordRules";

export function StaffChangePassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  const ruleState = getPasswordRuleState(newPassword);
  const passwordsMatch = newPassword === confirmNewPassword && newPassword !== "";
  const isValidPassword = isPasswordCompliant(newPassword);
  const emailMatches =
    email.trim().toLowerCase() !== "" &&
    email.trim().toLowerCase() === confirmEmail.trim().toLowerCase();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailMatches) {
      setError("Email confirmation does not match.");
      return;
    }

    if (!securityAnswer.trim()) {
      setError("Please answer the security question.");
      return;
    }

    const staffSecurityRaw = localStorage.getItem("staff_security");
    const staffSecurity = staffSecurityRaw
      ? (JSON.parse(staffSecurityRaw) as Array<{ email: string; password: string; securityQ1: string; securityQ2?: string }>)
      : [];

    // Must be either core staff or invited staff record.
    const coreStaffEmails = ["admin@goodsrecycling.org", "staff@goodsrecycling.org"];
    const invitedRaw = localStorage.getItem("staff_members");
    const invitedStaff = invitedRaw
      ? (JSON.parse(invitedRaw) as Array<{ email: string; password: string; name: string }> )
      : [];
    const isInvited = invitedStaff.some((m) => m.email.toLowerCase() === normalizedEmail);
    const isCore = coreStaffEmails.includes(normalizedEmail);
    if (!isInvited && !isCore) {
      setError("This email is not invited for staff access.");
      return;
    }

    if (!isValidPassword) {
      setError("New password does not meet all requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    const existing = staffSecurity.find((entry) => entry.email.toLowerCase() === normalizedEmail);
    const updatedSecurity = existing
      ? staffSecurity.map((entry) =>
          entry.email.toLowerCase() === normalizedEmail
            ? { ...entry, email: normalizedEmail, password: newPassword, securityQ1: securityAnswer, securityQ2: "" }
            : entry
        )
      : [...staffSecurity, { email: normalizedEmail, password: newPassword, securityQ1: securityAnswer, securityQ2: "" }];
    localStorage.setItem("staff_security", JSON.stringify(updatedSecurity));

    const userSession = localStorage.getItem("user_session");
    if (userSession) {
      try {
        const userData = JSON.parse(userSession) as Record<string, unknown>;
        userData.email = normalizedEmail;
        userData.passwordChanged = true;
        userData.password = newPassword;
        userData.securityQ1 = securityAnswer;
        userData.securityQ2 = "";
        localStorage.setItem("user_session", JSON.stringify(userData));
      } catch (parseError) {
        console.error("Failed to update session:", parseError);
      }
    }

    navigate("/staff/dashboard");
  }

  const rules = [
    { met: emailMatches, text: "Email confirmation matches" },
    { met: ruleState.hasLength, text: PASSWORD_RULE_TEXTS.hasLength },
    { met: ruleState.hasUppercase, text: PASSWORD_RULE_TEXTS.hasUppercase },
    { met: ruleState.hasLowercase, text: PASSWORD_RULE_TEXTS.hasLowercase },
    { met: ruleState.hasDigit, text: PASSWORD_RULE_TEXTS.hasDigit },
    { met: ruleState.hasSpecial, text: PASSWORD_RULE_TEXTS.hasSpecial },
    { met: passwordsMatch, text: "Passwords match" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F1EB] p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-10 shadow-lg">
        <div className="mb-2">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("user_session");
              localStorage.removeItem("current_user");
              localStorage.removeItem("userEmail");
              navigate("/login");
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Login
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800" style={{ fontFamily: "Playfair Display, serif" }}>
            Password Setup
          </h1>
          <p className="text-gray-600">Answer one security question and choose a new password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Confirm Email *</label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Re-enter your email"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">What is your favorite hobby? *</label>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => {
                if (e.target.value.length <= 50) {
                  setSecurityAnswer(e.target.value);
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter your answer"
              required
            />
            <p className="mt-1 text-xs text-gray-400">{securityAnswer.length}/50 characters</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">New Password *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={18} /></div>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  if (e.target.value.length <= 10) {
                    setNewPassword(e.target.value);
                  }
                }}
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-11 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="5-10 characters"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Confirm New Password *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={18} /></div>
              <input
                type={showConfirmNew ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => {
                  if (e.target.value.length <= 10) {
                    setConfirmNewPassword(e.target.value);
                  }
                }}
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-11 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Confirm new password"
                required
              />
              <button type="button" onClick={() => setShowConfirmNew(!showConfirmNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirmNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {newPassword && (
            <div className="space-y-1">
              <p className="mb-2 text-sm font-semibold text-gray-700">Password Requirements:</p>
              {rules.map((rule) => (
                <div key={rule.text} className={`flex items-center gap-2 text-sm ${rule.met ? "text-green-700" : "text-red-600"}`}>
                  {rule.met ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  <span>{rule.text}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={!emailMatches || !isValidPassword || !passwordsMatch || !securityAnswer.trim()}
            className="w-full rounded-xl bg-indigo-600 px-6 py-4 font-bold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set Password and Continue
          </button>
        </form>
      </div>
    </div>
  );
}
