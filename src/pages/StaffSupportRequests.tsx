import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageSquare, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
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

const statusIcons: Record<string, React.ReactNode> = {
  open: <Clock size={16} className="text-yellow-500" />,
  "in-progress": <AlertCircle size={16} className="text-blue-500" />,
  resolved: <CheckCircle size={16} className="text-green-500" />,
};

export function StaffSupportRequests() {
  const { user } = useSimpleAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const requests = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem("support_requests") || "[]") as SupportRequest[];
      return all.filter((r) => r.email === user?.email);
    } catch {
      return [];
    }
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link
          to="/portal"
          className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          Back to Portal
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Support Requests</h1>
            <p className="text-gray-600">Track your submitted support tickets</p>
          </div>
          <Link
            to="/support/new"
            className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            <MessageSquare size={16} />
            New Request
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No requests yet</h3>
            <p className="text-gray-500">
              You haven't submitted any support requests.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl shadow border border-gray-100">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === req.id ? null : req.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    {statusIcons[req.status] || statusIcons["open"]}
                    <div>
                      <p className="font-semibold text-gray-900">{req.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString()} ·{" "}
                        <span className="capitalize">{req.category}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[req.priority] || priorityColors["normal"]}`}
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
                  <div className="border-t border-gray-100 px-5 py-4">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap mb-3">
                      {req.message}
                    </p>
                    {req.adminResponse && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                          Staff Response
                        </p>
                        <p className="text-sm text-gray-800">{req.adminResponse}</p>
                      </div>
                    )}
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
