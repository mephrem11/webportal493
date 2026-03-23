import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  User,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  urgency: "low" | "normal" | "high" | "urgent";
  status: "pending" | "approved" | "fulfilled" | "rejected";
  createdAt: string;
  partnerOrg?: string;
  partnerEmail?: string;
  deliveryAddress?: string;
  notes?: string;
}

const urgencyColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock size={16} />,
  approved: <CheckCircle size={16} />,
  fulfilled: <CheckCircle size={16} />,
  rejected: <AlertCircle size={16} />,
};

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiToken] = useState(publicAnonKey);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-a47a578b/requests/${id}`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setRequest(data as Request);
        } else {
          // Fallback to localStorage
          const stored: Request[] = JSON.parse(
            localStorage.getItem("partner_requests") || "[]"
          );
          const found = stored.find((r) => r.id === id);
          if (found) {
            setRequest(found);
          } else {
            setError("Request not found.");
          }
        }
      } catch {
        const stored: Request[] = JSON.parse(
          localStorage.getItem("partner_requests") || "[]"
        );
        const found = stored.find((r) => r.id === id);
        if (found) {
          setRequest(found);
        } else {
          setError("Request not found.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, apiToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Not Found</h3>
          <p className="text-gray-500 mb-4">{error || "This request could not be found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#00C853] hover:bg-[#00B248] text-white px-5 py-2 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#00D084] to-[#00C878] px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{request.title}</h1>
            <p className="text-white/90 text-sm mt-1">Request #{request.id}</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Status & Urgency */}
            <div className="flex gap-3">
              <span
                className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full font-medium ${
                  statusColors[request.status] || statusColors["pending"]
                }`}
              >
                {statusIcons[request.status]}
                <span className="capitalize">{request.status}</span>
              </span>
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  urgencyColors[request.urgency] || urgencyColors["normal"]
                }`}
              >
                {request.urgency} urgency
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Tag size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Category</p>
                  <p className="text-gray-800">{request.category}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Package size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Quantity</p>
                  <p className="text-gray-800">{request.quantity} items</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Submitted</p>
                  <p className="text-gray-800">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {request.partnerOrg && (
                <div className="flex items-start gap-2">
                  <User size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Organization</p>
                    <p className="text-gray-800">{request.partnerOrg}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">{request.description}</p>
            </div>

            {/* Delivery Address */}
            {request.deliveryAddress && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Delivery Address
                </p>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-400 mt-0.5" />
                  <p className="text-gray-700 text-sm">{request.deliveryAddress}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {request.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-700">{request.notes}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
