import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Plus, CheckCircle, MapPin, User, Clock, Pencil, Trash2 } from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

interface ScheduledDelivery {
  id: string;
  day: string;
  time: string;
  address: string;
  contact: string;
  phone: string;
  status: "confirmed" | "pending";
  notes?: string;
  confirmedDate?: string;
}

type StoredDelivery = {
  id: string;
  day: string;
  startTime?: string;
  endTime?: string;
  address: string;
  contactName?: string;
  contactPhone?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
};

function formatTimeRange(start?: string, end?: string): string {
  if (!start && !end) return "Time not set";
  const startLabel = start || "-";
  const endLabel = end || "-";
  return `${startLabel} - ${endLabel}`;
}

function readDeliveries(): ScheduledDelivery[] {
  try {
    const raw = JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]") as StoredDelivery[];
    return raw.map((entry) => ({
      id: entry.id,
      day: entry.day,
      time: formatTimeRange(entry.startTime, entry.endTime),
      address: entry.address,
      contact: entry.contactName || "No contact name",
      phone: entry.contactPhone || "No phone",
      status: entry.status === "confirmed" ? "confirmed" : "pending",
      notes: entry.notes,
      confirmedDate: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : undefined,
    }));
  } catch {
    return [];
  }
}

export function WeeklySchedule() {
  const navigate = useNavigate();
  const { isAdmin } = useSimpleAuth();
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "scheduled_deliveries" || event.key === "partner_deliveries") {
        setRefreshToken((prev) => prev + 1);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const deliveries = useMemo(() => {
    void refreshToken;
    return readDeliveries();
  }, [refreshToken]);

  function handleEdit(id: string) {
    const raw = (() => {
      try {
        return JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]") as StoredDelivery[];
      } catch { return []; }
    })();
    const entry = raw.find((d) => d.id === id);
    if (entry) {
      localStorage.setItem("edit_delivery_draft", JSON.stringify(entry));
    }
    navigate(`/schedule-delivery?edit=${id}`);
  }

  function handleCancel(id: string) {
    if (!confirm("Cancel this delivery?")) return;
    try {
      const raw = JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]") as StoredDelivery[];
      const updated = raw.map((d) => d.id === id ? { ...d, status: "cancelled" } : d);
      localStorage.setItem("scheduled_deliveries", JSON.stringify(updated));
    } catch { /* ignore */ }
    try {
      const raw2 = JSON.parse(localStorage.getItem("partner_deliveries") || "[]") as StoredDelivery[];
      const updated2 = raw2.map((d) => d.id === id ? { ...d, status: "cancelled" } : d);
      localStorage.setItem("partner_deliveries", JSON.stringify(updated2));
    } catch { /* ignore */ }
    setRefreshToken((prev) => prev + 1);
    window.dispatchEvent(new Event("inventoryUpdated"));
  }

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate(isAdmin ? '/staff/dashboard' : '/portal')}
              className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-3 transition-colors text-sm"
            >
              <ArrowLeft size={18} />
              {isAdmin ? 'Back to Staff Portal' : 'Back to Portal'}
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Delivery Schedule</h1>
            <p className="text-gray-600">Manage your recurring weekly delivery appointments</p>
          </div>
          <button
            onClick={() => navigate('/schedule-delivery')}
            className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus size={20} />
            Add Schedule
          </button>
        </div>

        {/* Weekly Calendar */}
        <div className="bg-gray-100 border border-gray-200 rounded-t-lg px-6 py-4">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-gray-700" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Weekly Delivery Calendar</h2>
              <p className="text-sm text-gray-600">Next scheduled delivery times</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-lg shadow-lg divide-y divide-gray-200">
          {daysOfWeek.map((day) => {
            const dayDeliveries = deliveries.filter(d => d.day === day);
            
            return (
              <div key={day} className="p-6">
                {/* Day Header */}
                <div className="flex items-center gap-3 mb-3">
                  <Calendar size={20} className="text-gray-400" />
                  <h3 className="text-lg font-bold text-gray-900">{day}</h3>
                </div>

                {/* Deliveries for this day */}
                {dayDeliveries.length === 0 ? (
                  <p className="text-sm text-gray-500 pl-8">No deliveries scheduled</p>
                ) : (
                  <div className="space-y-4 pl-8">
                    {dayDeliveries.map((delivery) => (
                      <div key={delivery.id} className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Clock size={18} className="text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-gray-900">{delivery.time}</p>
                              {delivery.status === "confirmed" && (
                                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                                  <CheckCircle size={14} />
                                  Confirmed
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(delivery.id)}
                              className="flex items-center gap-1 px-3 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold">
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancel(delivery.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold">
                              <Trash2 size={14} />
                              Cancel
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin size={16} className="text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Address</p>
                              <p className="text-gray-900">{delivery.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <User size={16} className="text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Contact</p>
                              <p className="text-gray-900">{delivery.contact} • {delivery.phone}</p>
                            </div>
                          </div>
                        </div>

                        {delivery.notes && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notes:</p>
                            <p className="text-sm text-gray-700">{delivery.notes}</p>
                          </div>
                        )}

                        {delivery.confirmedDate && (
                          <div className="mt-2 text-xs text-gray-500">
                            Confirmed on {delivery.confirmedDate}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
