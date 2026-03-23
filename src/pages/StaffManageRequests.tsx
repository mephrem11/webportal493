import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

interface SupportRequest {
  id: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: string;
  createdAt: string;
  email: string;
  name: string;
  adminResponse?: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export function StaffManageRequests() {
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, loading: authLoading, logout } = useSimpleAuth();
  const [requests, setRequests] = useState<SupportRequest[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("support_requests") || "[]") as SupportRequest[];
    } catch {
      return [];
    }
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/");
      } else if (!isAdmin) {
        navigate("/");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const updateStatus = (id: string, status: string) => {
    const updated = requests.map((r) =>
      r.id === id ? { ...r, status } : r
    );
    setRequests(updated);
    localStorage.setItem("support_requests", JSON.stringify(updated));
  };

  const sendResponse = (id: string) => {
    const response = responseText[id];
    if (!response?.trim()) return;

    const updated = requests.map((r) =>
      r.id === id
        ? { ...r, adminResponse: response, status: "resolved" }
        : r
    );
    setRequests(updated);
    localStorage.setItem("support_requests", JSON.stringify(updated));
    setResponseText((prev) => ({ ...prev, [id]: "" }));
  };

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const statusIcon = (status: string) => {
    if (status === "resolved")
      return <CheckCircle size={16} className="text-green-500" />;
    if (status === "in-progress")
      return <AlertCircle size={16} className="text-blue-500" />;
    return <Clock size={16} className="text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate("/staff/dashboard")}
              className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-2 transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Back to Staff Portal
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Manage Support Requests
            </h1>
            <p className="text-gray-600">
              Respond to and resolve partner support tickets
            </p>
          </div>
          <button
            type="button"
            onClick={() => { logout(); navigate("/"); }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#00C853] bg-[#00C853] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00B248]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {["all", "open", "in-progress", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-[#00C853] text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No requests
            </h3>
            <p className="text-gray-500">
              No support requests match this filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl shadow border border-gray-100"
              >
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === req.id ? null : req.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    {statusIcon(req.status)}
                    <div>
                      <p className="font-semibold text-gray-900">{req.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {req.name} · {req.email} ·{" "}
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        priorityColors[req.priority] ||
                        priorityColors["normal"]
                      }`}
                    >
                      {req.priority}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium capitalize">
                      {req.status}
                    </span>
                    {expandedId === req.id ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedId === req.id && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {req.message}
                    </p>

                    {req.adminResponse && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 mb-1">
                          Your Response
                        </p>
                        <p className="text-sm text-gray-800">
                          {req.adminResponse}
                        </p>
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => updateStatus(req.id, "open")}
                        className="text-xs px-3 py-1 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      >
                        Mark Open
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, "in-progress")}
                        className="text-xs px-3 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, "resolved")}
                        className="text-xs px-3 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Resolved
                      </button>
                    </div>

                    {/* Response */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Response
                      </label>
                      <textarea
                        value={responseText[req.id] || ""}
                        onChange={(e) =>
                          setResponseText((prev) => ({
                            ...prev,
                            [req.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Write a response to the partner..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent resize-none"
                      />
                      <button
                        onClick={() => sendResponse(req.id)}
                        className="mt-2 flex items-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        <Send size={14} />
                        Send Response
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
