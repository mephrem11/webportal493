import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";

type SupportRequestFormProps = {
  userEmail?: string;
  userName?: string;
  userOrganization?: string;
  onRequestSubmitted?: () => void;
};

type FormData = {
  name: string;
  company: string;
  phone: string;
  extension: string;
  subject: string;
  description: string;
};

const MAX_LENGTHS = {
  name: 50,
  company: 50,
  phone: 20,
  extension: 10,
  subject: 100,
  description: 500,
} as const;

function validateField(name: keyof FormData, value: string): string {
  if (value.length > MAX_LENGTHS[name]) {
    return `Maximum ${MAX_LENGTHS[name]} characters allowed`;
  }

  if (name === "phone" && value) {
    const phoneRegex = /^[\d\s\-()]+$/;
    if (!phoneRegex.test(value)) {
      return "Please enter only numbers and characters like (), -, spaces";
    }
  }

  if (name === "extension" && value) {
    const extRegex = /^\d+$/;
    if (!extRegex.test(value)) {
      return "Extension must be numbers only";
    }
  }

  return "";
}

export function SupportRequestForm({
  userEmail,
  onRequestSubmitted,
}: SupportRequestFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    company: "",
    phone: "",
    extension: "",
    subject: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;

    const errorMessage = validateField(fieldName, value);
    setErrors((prev) => ({ ...prev, [name]: errorMessage }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const newErrors: Record<string, string> = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const errorMessage = validateField(key, formData[key]);
      if (errorMessage) {
        newErrors[key] = errorMessage;
      }
    });

    if (!formData.name.trim()) newErrors.name = "Partner Name is required";
    if (!formData.company.trim()) newErrors.company = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone Number is required";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const supportRequest = {
        id: `support-${crypto.randomUUID()}`,
        ...formData,
        email: userEmail,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        type: "support",
        comments: [],
      };

      const existingRequests = localStorage.getItem("support_requests");
      const requests = existingRequests
        ? (JSON.parse(existingRequests) as unknown[])
        : [];
      requests.push(supportRequest);
      localStorage.setItem("support_requests", JSON.stringify(requests));

      window.dispatchEvent(new CustomEvent("supportRequestAdded", { detail: supportRequest }));

      setSuccess(true);
      setFormData({
        name: "",
        company: "",
        phone: "",
        extension: "",
        subject: "",
        description: "",
      });
      setErrors({});

      setTimeout(() => setSuccess(false), 5000);

      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch {
      setError("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6 text-white">
        <Send size={28} />
        <div>
          <h2 className="text-2xl font-bold">Submit a Support Request</h2>
          <p className="text-emerald-50 text-sm">
            Need help? Submit a request and our staff will respond promptly.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-700 font-semibold">Request Submitted Successfully.</p>
              <p className="text-sm text-green-600 mt-1">
                Your request has been sent to staff and will appear in My Requests with a pending status.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
              Partner Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength={MAX_LENGTHS.name}
              className={`w-full px-4 py-2.5 border ${
                errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.name ? "focus:ring-red-500" : "focus:ring-emerald-500"
              }`}
            />
            <p className={`mt-1 text-xs ${errors.name ? "text-red-600" : "text-gray-500"}`}>
              {errors.name || `${formData.name.length}/${MAX_LENGTHS.name} characters`}
            </p>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-semibold text-gray-900 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              maxLength={MAX_LENGTHS.company}
              className={`w-full px-4 py-2.5 border ${
                errors.company ? "border-red-500 bg-red-50" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.company ? "focus:ring-red-500" : "focus:ring-emerald-500"
              }`}
            />
            <p className={`mt-1 text-xs ${errors.company ? "text-red-600" : "text-gray-500"}`}>
              {errors.company || `${formData.company.length}/${MAX_LENGTHS.company} characters`}
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={MAX_LENGTHS.phone}
              className={`w-full px-4 py-2.5 border ${
                errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.phone ? "focus:ring-red-500" : "focus:ring-emerald-500"
              }`}
            />
            <p className={`mt-1 text-xs ${errors.phone ? "text-red-600" : "text-gray-500"}`}>
              {errors.phone || "Numbers and characters like (), -, spaces only"}
            </p>
          </div>

          <div>
            <label htmlFor="extension" className="block text-sm font-semibold text-gray-900 mb-2">
              Extension <span className="text-gray-400 text-xs">(if needed)</span>
            </label>
            <input
              type="text"
              id="extension"
              name="extension"
              value={formData.extension}
              onChange={handleChange}
              maxLength={MAX_LENGTHS.extension}
              className={`w-full px-4 py-2.5 border ${
                errors.extension ? "border-red-500 bg-red-50" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.extension ? "focus:ring-red-500" : "focus:ring-emerald-500"
              }`}
            />
            <p className={`mt-1 text-xs ${errors.extension ? "text-red-600" : "text-gray-500"}`}>
              {errors.extension || `${formData.extension.length}/${MAX_LENGTHS.extension} characters`}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            maxLength={MAX_LENGTHS.subject}
            className={`w-full px-4 py-2.5 border ${
              errors.subject ? "border-red-500 bg-red-50" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 ${
              errors.subject ? "focus:ring-red-500" : "focus:ring-emerald-500"
            }`}
          />
          <p className={`mt-1 text-xs ${errors.subject ? "text-red-600" : "text-gray-500"}`}>
            {errors.subject || `${formData.subject.length}/${MAX_LENGTHS.subject} characters`}
          </p>
        </div>

        <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            maxLength={MAX_LENGTHS.description}
            rows={5}
            className={`w-full px-4 py-2.5 border ${
              errors.description ? "border-red-500 bg-red-50" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 ${
              errors.description ? "focus:ring-red-500" : "focus:ring-emerald-500"
            } resize-none`}
          />
          <p className={`mt-1 text-xs ${errors.description ? "text-red-600" : "text-gray-500"}`}>
            {errors.description || `${formData.description.length}/${MAX_LENGTHS.description} characters`}
          </p>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Submit Request</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          <span className="text-red-500">*</span> Required fields
        </p>
      </form>
    </div>
  );
}
