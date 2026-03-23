import { useEffect, useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface SupportRequest {
  id: string;
  subject: string;
  description: string;
  contact: string;
  status: "pending" | "resolved" | "in-progress";
  created: string;
  partnerName: string;
  name: string;
  phone: string;
  extension?: string;
  email?: string;
}

interface StaffSupportRequestManagerProps {
  staffName: string;
  staffEmail: string;
}

function getStoredSupportRequests(): SupportRequest[] {
  try {
    const saved = localStorage.getItem("support_requests");
    return saved ? (JSON.parse(saved) as SupportRequest[]) : [];
  } catch {
    return [];
  }
}

export function StaffSupportRequestManager({ staffName, staffEmail }: StaffSupportRequestManagerProps) {
  const [requests, setRequests] = useState<SupportRequest[]>(getStoredSupportRequests);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setRequests(getStoredSupportRequests());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "support_requests") refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    window.addEventListener("supportRequestsUpdated", refresh as EventListener);
    const timer = window.setInterval(refresh, 10000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("supportRequestsUpdated", refresh as EventListener);
      window.clearInterval(timer);
    };
  }, []);

  // staffName and staffEmail are available for future API integration
  void staffName;
  void staffEmail;

  function updateStatus(id: string, newStatus: "pending" | "resolved" | "in-progress") {
    try {
      const saved = localStorage.getItem("support_requests");
      if (saved) {
        const allRequests = JSON.parse(saved);
        const updated = allRequests.map((req: SupportRequest) =>
          req.id === id ? { ...req, status: newStatus } : req
        );
        localStorage.setItem("support_requests", JSON.stringify(updated));
        setRequests(updated);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-[#00D084] to-[#00C878] rounded-t-xl px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <MessageSquare size={28} />
          <div>
            <h2 className="text-2xl font-bold">Support Requests</h2>
            <p className="text-white/90 text-sm">Manage partner support requests • {requests.length} total</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-blue-200">
        {requests.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">No support requests yet.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div key={request.id}>
                <div
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {expandedId === request.id ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{request.subject}</h3>
                        <p className="text-sm text-gray-600">
                          {request.partnerName} · {request.created}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            request.status === "resolved"
                              ? "bg-green-100 text-green-700"
                              : request.status === "in-progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-200 text-gray-900"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedId === request.id && (
                  <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                    <div className="pt-4 space-y-4">
                      <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                        {request.description}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(request.id, "in-progress")}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
                        >
                          Mark In Progress
                        </button>
                        <button
                          onClick={() => updateStatus(request.id, "resolved")}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => updateStatus(request.id, "pending")}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold"
                        >
                          Mark Pending
                        </button>
                      </div>
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
