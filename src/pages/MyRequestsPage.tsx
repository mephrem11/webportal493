import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

interface SimpleRequest {
  id: string;
  item_type: string;
  quantity: number;
  pickup_address: string;
  notes: string;
  status: "scheduled" | "pending" | "cancelled";
  delivery_date?: string;
  partner_email?: string;
  created_at: string;
}

interface SupportRequest {
  id: string;
  subject: string;
  category?: string;
  message?: string;
  description?: string;
  status: string;
  createdAt: string;
  email: string;
  adminResponse?: string;
}

const reqStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    icon: <Clock size={13} />,
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-700 border border-blue-300",
    icon: <CheckCircle size={13} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border border-red-300",
    icon: <XCircle size={13} />,
  },
};

const supportStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: {
    label: "Open",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Clock size={13} />,
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    icon: <AlertCircle size={13} />,
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle size={13} />,
  },
};

function readSimpleRequests(email?: string): SimpleRequest[] {
  try {
    const all = JSON.parse(localStorage.getItem("simple_requests") || "[]") as SimpleRequest[];
    return all.filter((request) => request.partner_email === email);
  } catch {
    return [];
  }
}

function readSupportRequests(email?: string): SupportRequest[] {
  try {
    const all = JSON.parse(localStorage.getItem("support_requests") || "[]") as SupportRequest[];
    return all.filter((request) => request.email === email);
  } catch {
    return [];
  }
}

export function MyRequestsPage() {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"requests" | "support">("requests");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const onInventoryUpdate = () => setRefreshToken((x) => x + 1);
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === "inventory_items" ||
        event.key === "simple_requests" ||
        event.key === "support_requests"
      ) {
        setRefreshToken((x) => x + 1);
      }
    };

    window.addEventListener("inventoryUpdated", onInventoryUpdate);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("inventoryUpdated", onInventoryUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const simpleRequests = useMemo(() => {
    void refreshToken;
    return readSimpleRequests(user?.email);
  }, [user?.email, refreshToken]);

  const supportRequests = useMemo(() => {
    void refreshToken;
    return readSupportRequests(user?.email);
  }, [user?.email, refreshToken]);

  return (
    <div className="min-h-screen bg-[#E8E3DC]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/portal")}
          className="flex items-center gap-2 text-[#2E7D5E] hover:text-[#246B4E] mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back to Portal
        </button>

        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit">
          {(
            [
              { key: "requests", label: "My Requests", count: simpleRequests.length },
              {
                key: "support",
                label: "Support Tickets",
                count: supportRequests.filter((s) => s.status === "open").length,
              },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setExpandedId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? "bg-[#2E7D5E] text-white shadow" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
              {count !== null && count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                    tab === key ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => setRefreshToken((x) => x + 1)}
            title="Refresh"
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {tab === "requests" && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">My Goods Requests</h2>
              <button
                onClick={() => navigate("/portal")}
                className="flex items-center gap-1.5 bg-[#2E7D5E] hover:bg-[#266B50] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={14} />
                New Request
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Item", "Qty", "Address", "Status", "Delivery", ""].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {simpleRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center">
                        <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No requests yet. Go to the portal to submit your first request.</p>
                      </td>
                    </tr>
                  ) : (
                    simpleRequests.flatMap((request) => {
                      const status = reqStatusConfig[request.status] || reqStatusConfig.pending;
                      const expanded = expandedId === request.id;

                      const rows: React.ReactNode[] = [
                        <tr
                          key={request.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedId(expanded ? null : request.id)}
                        >
                          <td className="px-5 py-4 text-sm font-medium text-gray-900">{request.item_type}</td>
                          <td className="px-5 py-4 text-sm text-gray-700">{request.quantity}</td>
                          <td className="px-5 py-4 text-sm text-gray-600 max-w-[140px] truncate">{request.pickup_address}</td>
                          <td className="px-5 py-4">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium w-fit ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700">{request.delivery_date || "-"}</td>
                          <td className="px-5 py-4 text-gray-400">
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </td>
                        </tr>,
                      ];

                      if (expanded) {
                        rows.push(
                          <tr key={`${request.id}-expanded`} className="bg-gray-50">
                            <td colSpan={6} className="px-5 py-3 text-sm text-gray-700">
                              <span className="font-medium">Notes:</span> {request.notes || "-"}
                              <span className="ml-4 text-gray-400 text-xs">
                                Submitted {new Date(request.created_at).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        );
                      }

                      return rows;
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "support" && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">My Support Tickets</h2>
              <button
                onClick={() => navigate("/submit-support-request")}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={14} />
                New Ticket
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {supportRequests.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No support tickets yet.</p>
                </div>
              ) : (
                supportRequests.map((request) => {
                  const status = supportStatusConfig[request.status] || supportStatusConfig.open;
                  const expanded = expandedId === request.id;

                  return (
                    <div key={request.id}>
                      <div
                        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedId(expanded ? null : request.id)}
                      >
                        <div className="flex items-center gap-3">
                          {status.icon}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{request.subject}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(request.createdAt).toLocaleDateString()}
                              {request.category ? ` · ${request.category}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          {expanded ? (
                            <ChevronUp size={16} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expanded && (
                        <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                          <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{request.message || request.description}</p>
                          {request.adminResponse && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-xs font-semibold text-blue-700 mb-1">Staff Response</p>
                              <p className="text-sm text-blue-800">{request.adminResponse}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
