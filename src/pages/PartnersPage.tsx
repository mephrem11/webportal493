import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  FileText,
  UserCheck,
  Package,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import {
  buildPartnerApplicationConfirmEmail,
  buildStaffNotifyEmail,
} from "../utils/emailSimulation";
import { sendPortalEmail } from "../utils/emailService";
import { buildApplicationSubmissionSms, sendPortalSms } from "../utils/smsService";

const benefits = [
  {
    icon: <Package size={24} className="text-[#00C853]" />,
    title: "Free Quality Goods",
    desc: "Access donated clothing, household items, and more at no cost.",
  },
  {
    icon: <FileText size={24} className="text-[#00C853]" />,
    title: "Simple Online Requests",
    desc: "Submit and track requests through our easy-to-use partner portal.",
  },
  {
    icon: <UserCheck size={24} className="text-[#00C853]" />,
    title: "Dedicated Support",
    desc: "Our team is here to help ensure you get what your clients need.",
  },
  {
    icon: <Heart size={24} className="text-[#00C853]" />,
    title: "Community Impact",
    desc: "Join a network of organizations working together to serve our community.",
  },
];

export function PartnersPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    orgName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    mission: "",
    clientsServed: "",
    estimatedNeed: "",
    agreeTerms: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    const applications = JSON.parse(
      localStorage.getItem("partner_applications") || "[]"
    );
    applications.push({
      ...form,
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      status: "pending",
    });
    localStorage.setItem("partner_applications", JSON.stringify(applications));

    const normalizedEmail = form.email.trim().toLowerCase();
    const orgName = form.orgName.trim() || "Organization";

    const partnerEmail = buildPartnerApplicationConfirmEmail(form.contactName.trim());
    const partnerSend = await sendPortalEmail({
      to: normalizedEmail,
      from: partnerEmail.from,
      subject: partnerEmail.subject,
      message: partnerEmail.message,
    });

    const smsSend = await sendPortalSms({
      to: form.phone.trim(),
      message: buildApplicationSubmissionSms(form.contactName.trim()),
    });

    const staffEmail = buildStaffNotifyEmail(normalizedEmail, orgName);
    const staffSend = await sendPortalEmail({
      to: "admin@goodsrecycling.org",
      from: staffEmail.from,
      subject: staffEmail.subject,
      message: staffEmail.message,
    });

    if (!partnerSend.sent || !staffSend.sent || !smsSend.sent) {
      const details = [partnerSend.error, staffSend.error, smsSend.error].filter(Boolean).join(" | ");
      alert(`Application submitted. Email provider fallback is active. ${details}`);
    }

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for applying to become a Goods Recycling partner. Our team will review your application and get back to you within 5 business days.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            We sent a confirmation email to <strong>{form.email}</strong> and a confirmation text to <strong>{form.phone}</strong>
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#00C853] hover:bg-[#00B248] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#00C853] to-[#00A843] text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Become a Partner</h1>
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Join our network of nonprofits and community organizations receiving
          quality donated goods for the people you serve.
        </p>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Why Partner with Us?
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-5 shadow-sm text-center">
                <div className="flex justify-center mb-3">{b.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-gray-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#00D084] to-[#00C878] px-8 py-6">
            <div className="flex items-center gap-3">
              <ArrowRight size={24} className="text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">Partner Application</h2>
                <p className="text-white/90 text-sm">Tell us about your organization</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.orgName}
                  onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street address, city, state, ZIP"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Mission <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={form.mission}
                onChange={(e) => setForm({ ...form, mission: e.target.value })}
                rows={3}
                placeholder="Describe your organization's mission and the clients you serve..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clients Served Annually
                </label>
                <input
                  type="text"
                  value={form.clientsServed}
                  onChange={(e) => setForm({ ...form, clientsServed: e.target.value })}
                  placeholder="e.g., 500 individuals"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Monthly Need
                </label>
                <input
                  type="text"
                  value={form.estimatedNeed}
                  onChange={(e) => setForm({ ...form, estimatedNeed: e.target.value })}
                  placeholder="e.g., 200 clothing items"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={form.agreeTerms}
                onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                required
                className="mt-1"
              />
              <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                I confirm that my organization is a registered 501(c)(3) nonprofit or government
                agency and agree to use donated goods solely for charitable purposes.{" "}
                <span className="text-red-500">*</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !form.agreeTerms}
              className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle size={18} />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </motion.div>
      </section>
    </div>
  );
}
