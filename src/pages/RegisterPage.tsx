import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import { getPasswordRuleState, isPasswordCompliant, PASSWORD_RULE_TEXTS } from "../utils/passwordRules";
import {
  buildPartnerConfirmEmail,
  buildStaffNotifyEmail,
} from "../utils/emailSimulation";
import { sendPortalEmail } from "../utils/emailService";
import { buildAccountSubmissionSms, sendPortalSms } from "../utils/smsService";

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useSimpleAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    password: "",
    confirmPassword: "",
    securityQ1: "",
    securityQ2: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ruleState = getPasswordRuleState(form.password);
  const matches = form.password.length > 0 && form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordCompliant(form.password)) {
      setError("Password does not meet all required rules.");
      return;
    }
    if (!matches) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.securityQ1.trim() || !form.securityQ2.trim()) {
      setError("Please answer both security questions.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    // Save to localStorage user_accounts
    const accounts = JSON.parse(localStorage.getItem("user_accounts") || "[]");
    const exists = accounts.some(
      (a: { email: string }) => a.email === form.email
    );
    if (exists) {
      setError("An account with this email already exists.");
      setLoading(false);
      return;
    }

    accounts.push({
      email: form.email,
      name: form.name,
      phone: form.phone,
      organization: form.organization,
      password: form.password,
      role: "charity_partner",
      status: "pending",
      securityQ1: form.securityQ1,
      securityQ2: form.securityQ2,
      createdAt: new Date().toISOString(),
      // Legacy compatibility for older recovery flows.
      securityQuestion: "What city were you born in?",
      securityAnswer: form.securityQ1,
    });
    localStorage.setItem("user_accounts", JSON.stringify(accounts));

    // Also add to mock_users for staff visibility
    const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
    mockUsers.push({
      id: Date.now().toString(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      organization: form.organization,
      role: "charity_partner",
      status: "pending",
      securityQ1: form.securityQ1,
      securityQ2: form.securityQ2,
      // Legacy compatibility for older recovery flows.
      securityQuestion: "What city were you born in?",
      securityAnswer: form.securityQ1,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("mock_users", JSON.stringify(mockUsers));

    // Confirmation email to partner (real provider if configured; simulated fallback otherwise).
    const partnerEmail = buildPartnerConfirmEmail(form.name.trim());
    const partnerSend = await sendPortalEmail({
      to: form.email.trim().toLowerCase(),
      from: partnerEmail.from,
      subject: partnerEmail.subject,
      message: partnerEmail.message,
    });

    const smsSend = await sendPortalSms({
      to: form.phone.trim(),
      message: buildAccountSubmissionSms(form.name.trim()),
    });

    // Staff-side notification email.
    const staffEmail = buildStaffNotifyEmail(form.email.trim().toLowerCase(), form.organization.trim());
    await sendPortalEmail({
      to: "admin@goodsrecycling.org",
      from: staffEmail.from,
      subject: staffEmail.subject,
      message: staffEmail.message,
    });

    const emailState = partnerSend.sent ? "sent" : "queued";
    const smsState = smsSend.sent ? "sent" : "queued";
    alert(
      `Account created! We received your form submission. Confirmation email ${emailState} to ${form.email.trim().toLowerCase()} and confirmation text ${smsState} to ${form.phone.trim()}. A staff member will review your account before access is granted.`
    );

    // Auto-login the new partner and show their account status page
    try {
      await login(form.email.trim().toLowerCase(), form.password);
    } catch { /* ignore */ }
    setLoading(false);
    navigate("/my-account");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00C853]/10 to-white flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
        <div className="bg-gradient-to-r from-[#C6F6D5] to-[#A7F3D0] px-8 py-6 text-center">
          <div className="w-14 h-14 bg-white/70 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserPlus size={28} className="text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-950">Create Account</h1>
          <p className="text-gray-800 text-sm mt-1">Join the Goods Recycling partner network</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
            <input
              type="text"
              required
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Phone *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. +1 555-123-4567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="5-10 chars, upper/lower/number/special"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
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

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Question: What city were you born in? *</label>
            <input
              type="text"
              required
              value={form.securityQ1}
              onChange={(e) => setForm({ ...form, securityQ1: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Question: What is your favorite hobby? *</label>
            <input
              type="text"
              required
              value={form.securityQ2}
              onChange={(e) => setForm({ ...form, securityQ2: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={18} />
                Create Account
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-[#00C853] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
