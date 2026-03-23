import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

type SupportForm = {
  partnerName: string;
  name: string;
  phone: string;
  extension: string;
  subject: string;
  description: string;
};

const PHONE_PATTERN = /^[\d\s()+.-]*$/;

export function SubmitSupportRequest() {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SupportForm>({
    partnerName: "",
    name: "",
    phone: "",
    extension: "",
    subject: "",
    description: "",
  });

  const setField = <K extends keyof SupportForm>(field: K, value: SupportForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!PHONE_PATTERN.test(form.phone)) {
      setError("Phone number contains invalid characters.");
      return;
    }

    if (form.description.length > 200) {
      setError("Description must be 200 characters or fewer.");
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem("support_requests") || "[]") as Array<Record<string, string>>;
      const newRequest = {
        id: Date.now().toString(),
        partnerName: form.partnerName,
        name: form.name,
        phone: form.phone,
        extension: form.extension,
        subject: form.subject,
        description: form.description,
        message: form.description,
        email: user?.email || "",
        status: "open",
        createdAt: new Date().toISOString(),
      };

      existing.push(newRequest);
      localStorage.setItem("support_requests", JSON.stringify(existing));
      setSubmitted(true);
    } catch {
      setError("Failed to submit support request. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted</h2>
          <p className="text-gray-600 mb-6">Your support ticket has been sent to the team.</p>
          <button
            onClick={() => navigate("/my-requests")}
            className="bg-[#2E7D5E] hover:bg-[#266B50] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go To My Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8E3DC]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/portal")}
          className="flex items-center gap-2 text-[#2E7D5E] hover:text-[#246B4E] mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back to Portal
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Submit Support Request</h1>
            <p className="text-gray-600 mt-1">Share your issue and the support team will follow up.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name *</label>
                <input
                  required
                  value={form.partnerName}
                  onChange={(e) => setField("partnerName", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extension</label>
                <input
                  value={form.extension}
                  onChange={(e) => setField("extension", e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setField("subject", e.target.value)}
                placeholder="Brief summary"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description * (max 200 characters)</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setField("description", e.target.value.slice(0, 200))}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent resize-none"
              />
              <div className="mt-1 text-xs text-gray-500">{form.description.length}/200</div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#2E7D5E] hover:bg-[#266B50] text-white py-3 rounded-lg font-semibold transition-colors"
            >
              <Send size={18} />
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
