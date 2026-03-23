import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Clock, CheckCircle } from "lucide-react";
import { AddressAutocomplete } from "../components/AddressAutocomplete";
import { triggerGoogleSheetsSync } from "../utils/googleSheetsSync";

export function ScheduleDelivery() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [form, setForm] = useState({
    day: "Monday",
    startTime: "10:00",
    endTime: "12:00",
    address: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editId) {
      try {
        const draft = JSON.parse(localStorage.getItem("edit_delivery_draft") || "null");
        if (draft) {
          setForm({
            day: draft.day || "Monday",
            startTime: draft.startTime || "10:00",
            endTime: draft.endTime || "12:00",
            address: draft.address || "",
            contactName: draft.contactName || "",
            contactPhone: draft.contactPhone || "",
            notes: draft.notes || "",
          });
          localStorage.removeItem("edit_delivery_draft");
        }
      } catch { /* ignore */ }
    }
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    await new Promise((r) => setTimeout(r, 800));

    if (editId) {
      // Update existing delivery
      try {
        const existing = JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]") as Array<Record<string, unknown>>;
        const updated = existing.map((d) => d.id === editId ? { ...d, ...form } : d);
        localStorage.setItem("scheduled_deliveries", JSON.stringify(updated));
      } catch { /* ignore */ }
      try {
        const pd = JSON.parse(localStorage.getItem("partner_deliveries") || "[]") as Array<Record<string, unknown>>;
        const updatedPd = pd.map((d) => d.id === editId ? { ...d, ...form } : d);
        localStorage.setItem("partner_deliveries", JSON.stringify(updatedPd));
      } catch { /* ignore */ }
    } else {
      const existing = JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]");
      const partnerDeliveries = JSON.parse(localStorage.getItem("partner_deliveries") || "[]");
      const newDelivery = {
        id: Date.now().toString(),
        ...form,
        scheduledDate: new Date().toISOString(),
        items: [],
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
      existing.push(newDelivery);
      partnerDeliveries.push(newDelivery);
      localStorage.setItem("scheduled_deliveries", JSON.stringify(existing));
      localStorage.setItem("partner_deliveries", JSON.stringify(partnerDeliveries));
    }
    void triggerGoogleSheetsSync("delivery_created");
    window.dispatchEvent(new Event("inventoryUpdated"));

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{editId ? "Delivery Updated!" : "Delivery Scheduled!"}</h2>
          <p className="text-gray-600 mb-2">
            Your weekly delivery for <strong>{form.day}</strong> has been {editId ? "updated" : "scheduled"}.</p>
          <p className="text-gray-500 text-sm mb-6">
            {form.startTime} – {form.endTime} at {form.address}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/weekly-schedule")}
              className="bg-[#00C853] hover:bg-[#00B248] text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
            >
              View Schedule
            </button>
            <button
              onClick={() => navigate("/portal")}
              className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Portal
            </button>
          </div>
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

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gray-100 border-b border-gray-200 px-8 py-6">
            <div className="flex items-center gap-3">
              <Calendar size={28} className="text-gray-700" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{editId ? "Edit Delivery" : "Schedule Weekly Delivery"}</h1>
                <p className="text-gray-600 text-sm">
                  {editId ? "Update the details for this delivery" : "Set a recurring weekly pickup time for your organization"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Week <span className="text-red-500">*</span>
              </label>
              <select
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                  (d) => (
                    <option key={d} value={d}>{d}</option>
                  )
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={14} className="inline mr-1" />
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={14} className="inline mr-1" />
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <AddressAutocomplete
                label="Pickup Address"
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
                placeholder="Enter full street address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={14} className="inline mr-1" />
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="Receiving person"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="(555) 555-5555"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Loading dock, gate code, parking instructions..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Calendar size={18} />
                  Schedule Delivery
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
