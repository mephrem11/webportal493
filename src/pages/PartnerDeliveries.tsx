import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck,
  Calendar,
  MapPin,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Search,
} from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

interface Delivery {
  id: string;
  scheduledDate: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  address: string;
  drivers?: string;
  milestone?: string;
  contactName?: string;
  items: string[];
  status: "awaiting-pickup" | "in-progress" | "full" | "half-full" | "cancelled" | "scheduled" | "in-transit" | "delivered";
  notes?: string;
  createdAt: string;
}

function firstText(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function parseItems(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (raw === undefined || raw === null) return [];
  return String(raw)
    .split(/\||,|;|\n|\//g)
    .map((item) => item.trim())
    .filter(Boolean);
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  "awaiting-pickup": {
    label: "Awaiting Pickup",
    color: "bg-blue-100 text-blue-700",
    icon: <Calendar size={14} />,
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Truck size={14} />,
  },
  full: {
    label: "Full",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle size={14} />,
  },
  "half-full": {
    label: "Half Full",
    color: "bg-amber-100 text-amber-700",
    icon: <AlertCircle size={14} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: <AlertCircle size={14} />,
  },
  // Backward compatibility for previously stored statuses.
  scheduled: {
    label: "Awaiting Pickup",
    color: "bg-blue-100 text-blue-700",
    icon: <Calendar size={14} />,
  },
  "in-transit": {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Truck size={14} />,
  },
  delivered: {
    label: "Full",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle size={14} />,
  },
};

function normalizeDeliveryStatus(status: string): Delivery["status"] {
  const normalized = status.trim().toLowerCase();
  if (!normalized) return "awaiting-pickup";
  if (normalized === "in transit" || normalized === "in-transit" || normalized === "in progress" || normalized === "in-progress") {
    return "in-progress";
  }
  if (normalized === "full" || normalized === "delivered" || normalized === "complete" || normalized === "completed") {
    return "full";
  }
  if (normalized === "half full" || normalized === "half-full" || normalized === "halffull" || normalized === "hakfl full") {
    return "half-full";
  }
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  if (normalized === "scheduled" || normalized === "awaiting pickup" || normalized === "awaiting-pickup") {
    return "awaiting-pickup";
  }
  return "awaiting-pickup";
}

export function PartnerDeliveries() {
  const pageSizeOptions = [15, 25, 45, 50, 95, 100] as const;
  const { isAdmin } = useSimpleAuth();
  const navigate = useNavigate();

  const readDeliveries = (): Delivery[] => {
    try {
      const scheduledRaw = JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]") as Array<Record<string, unknown>>;
      const partnerRaw = JSON.parse(localStorage.getItem("partner_deliveries") || "[]") as Array<Record<string, unknown>>;
      const merged = [...scheduledRaw, ...partnerRaw].map((row, index) => {
        const status = normalizeDeliveryStatus(firstText(row, ["status"]));
        return {
          id: firstText(row, ["id", "deliveryId", "delivery_id"]) || `delivery-${index + 1}`,
          scheduledDate: firstText(row, ["scheduledDate", "scheduled_date", "deliveryDate", "delivery_date"]) || new Date().toISOString(),
          day: firstText(row, ["day"]),
          startTime: firstText(row, ["startTime", "start_time"]),
          endTime: firstText(row, ["endTime", "end_time"]),
          address: firstText(row, ["address", "binAddress", "bin_address"]),
          drivers: firstText(row, ["drivers", "driver", "driverName", "driver_name", "contactName", "contact_name"]),
          milestone: firstText(row, ["milestone", "stage", "step"]),
          contactName: firstText(row, ["contactName", "contact_name"]),
          items: parseItems(row.items),
          status,
          notes: firstText(row, ["notes"]),
          createdAt: firstText(row, ["createdAt", "created_at"]) || new Date().toISOString(),
        };
      });

      const byId = new Map<string, Delivery>();
      for (const delivery of merged) {
        if (!delivery?.id) continue;
        byId.set(delivery.id, delivery);
      }
      return Array.from(byId.values()).sort((a, b) =>
        new Date(b.createdAt || b.scheduledDate).getTime() - new Date(a.createdAt || a.scheduledDate).getTime()
      );
    } catch {
      return [];
    }
  };

  const [deliveries, setDeliveries] = useState<Delivery[]>(() => {
    return readDeliveries();
  });
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  useEffect(() => {
    const refresh = () => setDeliveries(readDeliveries());
    const onStorage = (event: StorageEvent) => {
      if (event.key === "scheduled_deliveries" || event.key === "partner_deliveries") {
        refresh();
      }
    };

    window.addEventListener("inventoryUpdated", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("inventoryUpdated", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const filtered = deliveries.filter((delivery) => {
    if (filter !== "all" && delivery.status !== filter) return false;
    if (!searchTerm.trim()) return true;

    const haystack = [
      delivery.id,
      delivery.address,
      delivery.drivers,
      delivery.contactName,
      delivery.milestone,
      delivery.items.join(" "),
      delivery.status,
      delivery.day,
      delivery.scheduledDate,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm.trim().toLowerCase());
  });

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const endIndexExclusive = Math.min(startIndex + rowsPerPage, totalRows);
  const pagedDeliveries = filtered.slice(startIndex, endIndexExclusive);
  const displayStart = totalRows === 0 ? 0 : startIndex + 1;
  const displayEnd = totalRows === 0 ? 0 : endIndexExclusive;

  const formatSchedule = (delivery: Delivery): string => {
    const parsed = new Date(delivery.scheduledDate);
    const dateText = Number.isNaN(parsed.getTime())
      ? delivery.scheduledDate || "TBD"
      : parsed.toLocaleDateString();
    const dayText = delivery.day ? `${delivery.day} • ` : "";
    const timeText = delivery.startTime && delivery.endTime ? ` (${delivery.startTime}-${delivery.endTime})` : "";
    return `${dayText}${dateText}${timeText}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(isAdmin ? "/staff/dashboard" : "/portal")}
          className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          {isAdmin ? "Back to Dashboard" : "Back to Portal"}
        </button>
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Deliveries</h1>
            <p className="text-gray-600">Shared delivery schedule for both partners and staff</p>
            <p className="text-xs text-gray-500 mt-1">Items and statuses are updated from Google Sheets by staff.</p>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="deliveries-search" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Search Deliveries
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              id="deliveries-search"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by BIN address, driver, milestone, or ID"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C853] text-gray-900"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "awaiting-pickup", "in-progress", "full", "half-full", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-[#00C853] text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "All" : (statusConfig[f]?.label || f)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <Truck size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No deliveries
            </h3>
            <p className="text-gray-500 mb-4">
              {deliveries.length === 0
                ? "No deliveries scheduled yet."
                : "No deliveries match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pagedDeliveries.map((delivery) => {
              const sc = statusConfig[delivery.status] || statusConfig["awaiting-pickup"];
              return (
                <div
                  key={delivery.id}
                  className="bg-white rounded-xl shadow border border-gray-100 p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Truck size={20} className="text-[#00C853]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Delivery #{delivery.id.slice(-6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Scheduled: {new Date(delivery.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.color}`}
                    >
                      {sc.icon}
                      {sc.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-start gap-2">
                      <MapPin size={15} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">BIN Address</p>
                        <p className="text-gray-700">{delivery.address || "TBD"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package size={15} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Items</p>
                        <p className="text-gray-700">{delivery.items.join(", ") || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Driver Schedule</p>
                      <p className="text-gray-700">{formatSchedule(delivery)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Drivers</p>
                      <p className="text-gray-700">{delivery.drivers || delivery.contactName || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Milestone</p>
                      <p className="text-gray-700">{delivery.milestone || (delivery.status === "full" || delivery.status === "delivered" ? "Completed" : delivery.status === "in-progress" || delivery.status === "in-transit" ? "In Progress" : delivery.status === "half-full" ? "Half Full" : delivery.status === "cancelled" ? "Cancelled" : "Awaiting Pickup")}</p>
                    </div>
                  </div>

                  {delivery.notes && (
                    <p className="text-xs text-gray-500 mb-3">Notes: {delivery.notes}</p>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Link
                      to={`/request/${delivery.id}`}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <Clock size={14} />
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalRows > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-medium">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C853]"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span>{displayStart}-{displayEnd} of {totalRows}</span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
