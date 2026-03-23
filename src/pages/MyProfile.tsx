import { useNavigate } from "react-router-dom";
import { FileText, User, ArrowLeft, ChevronRight } from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

export function MyProfile() {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-[#F0F9FF]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <button
          onClick={() => navigate("/portal")}
          className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          Back to Portal
        </button>

        <div className="mb-4 rounded-xl bg-gradient-to-r from-[#00D084] to-[#00C878] px-6 py-5 text-white shadow-lg flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <User size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.name || "Partner User"}</h1>
            <p className="text-white/80 text-sm">{user?.email}</p>
            <p className="text-white/60 text-xs mt-0.5">{user?.organization}</p>
          </div>
        </div>

        <div
          className="mb-4 cursor-pointer rounded-xl bg-white px-6 py-4 shadow border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"
          onClick={() => navigate("/my-requests")}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">My Requests</h2>
              <p className="text-sm text-gray-500">View all submitted goods requests</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </div>

        <div
          className="mb-4 cursor-pointer rounded-xl bg-white px-6 py-4 shadow border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"
          onClick={() => navigate("/partner/profile")}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <User size={20} className="text-[#00C853]" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Organization Profile</h2>
              <p className="text-sm text-gray-500">Update contact details and address</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </div>

        <div className="rounded-xl bg-white p-6 shadow border border-gray-100">
          <h3 className="mb-4 text-base font-bold text-gray-900">Account Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-gray-900">{user?.name || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Organization</span>
              <span className="text-sm font-medium text-gray-900">{user?.organization || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
