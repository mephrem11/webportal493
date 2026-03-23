import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  Building2,
  Mail,
  Calendar,
} from "lucide-react";

interface AccountInfo {
  name: string;
  email: string;
  organization: string;
  status: "pending" | "active" | "suspended";
  createdAt?: string;
}

function getAccountInfo(email: string): AccountInfo | null {
  try {
    const accounts = JSON.parse(
      localStorage.getItem("user_accounts") || "[]"
    ) as Array<AccountInfo & { email: string }>;
    const found = accounts.find(
      (a) => a.email.toLowerCase() === email.toLowerCase()
    );
    if (found) {
      return {
        name: found.name,
        email: found.email,
        organization: found.organization,
        status: (found.status as AccountInfo["status"]) || "pending",
        createdAt: (found as unknown as { createdAt?: string }).createdAt,
      };
    }
  } catch { /* ignore */ }

  try {
    const mockUsers = JSON.parse(
      localStorage.getItem("mock_users") || "[]"
    ) as Array<AccountInfo & { email: string }>;
    const found = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (found) {
      return {
        name: found.name,
        email: found.email,
        organization: found.organization,
        status: found.status || "pending",
        createdAt: found.createdAt,
      };
    }
  } catch { /* ignore */ }

  return null;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending Approval",
    icon: <Clock size={24} className="text-yellow-600 flex-shrink-0" />,
    border: "border-yellow-200",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    message:
      "Thank you for your account application. A staff member will review your account before access is granted. You'll be notified once a decision is made.",
  },
  active: {
    label: "Accepted",
    icon: <CheckCircle size={24} className="text-green-600 flex-shrink-0" />,
    border: "border-green-200",
    bg: "bg-green-50",
    text: "text-green-800",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    message:
      "Your account has been approved. You now have full access to the partner portal.",
  },
  suspended: {
    label: "Declined",
    icon: <XCircle size={24} className="text-red-600 flex-shrink-0" />,
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-800",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    message:
      "Your account application was not approved. Please contact staff for more information.",
  },
};

export function PartnerAccountStatus() {
  const { user, isAuthenticated, loading: authLoading } = useSimpleAuth();
  const navigate = useNavigate();
  const [accountRevision, setAccountRevision] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    // Account is derived below; this effect only handles auth redirect.
  }, [user, isAuthenticated, authLoading, navigate]);

  // Refresh from storage (e.g. after staff approves)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if ((e.key === "user_accounts" || e.key === "mock_users") && user) {
        setAccountRevision((v) => v + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user]);

  const account = useMemo(() => {
    // Force recompute when storage-backed account data changes.
    void accountRevision;
    if (!user) return null;
    const info = getAccountInfo(user.email);
    if (info) return info;
    // Demo/staff accounts — treat as active
    return {
      name: user.name,
      email: user.email,
      organization: user.organization,
      status: "active" as const,
    };
  }, [user, accountRevision]);

  if (authLoading || !account) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[account.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button
          onClick={() => navigate("/portal")}
          className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-6 text-sm transition-colors"
        >
          <ArrowLeft size={18} /> Back to Portal
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00D084] to-[#00C878] px-8 py-6">
            <div className="flex items-center gap-3">
              <User size={28} className="text-white" />
              <div>
                <h1
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  My Account
                </h1>
                <p className="text-white/90 text-sm">
                  Application &amp; Account Status
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Status Banner */}
            <div
              className={`flex items-start gap-3 border rounded-xl p-4 ${cfg.bg} ${cfg.border}`}
            >
              {cfg.icon}
              <div>
                <p className={`font-semibold ${cfg.text}`}>{cfg.label}</p>
                <p className={`text-sm mt-0.5 ${cfg.text} opacity-80`}>
                  {cfg.message}
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Submitted Information
              </h2>

              <div className="grid gap-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Organization</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.organization || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {cfg.icon}
                  <div>
                    <p className="text-xs text-gray-500">Account Status</p>
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {account.createdAt && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Submitted On</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(account.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {account.status === "active" && (
                <Link
                  to="/portal"
                  className="block w-full text-center bg-[#00C853] hover:bg-[#00B248] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                >
                  Go to Partner Portal
                </Link>
              )}
              {account.status === "pending" && (
                <p className="text-center text-xs text-gray-400 py-1">
                  Come back here any time to check your approval status.
                </p>
              )}
              {account.status === "suspended" && (
                <a
                  href="mailto:admin@goodsrecycling.org"
                  className="block w-full text-center border border-gray-300 text-gray-600 py-2.5 px-4 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Contact Staff
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
