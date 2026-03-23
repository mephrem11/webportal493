import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Truck, AlertCircle } from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

type Delivery = {
  id: string;
  scheduledDate?: string;
  address?: string;
  status?: string;
  milestone?: string;
  drivers?: string;
  contactName?: string;
  confirmedAt?: string;
  createdAt?: string;
};

function normalizeStatus(status: string | undefined): string {
  const value = (status || "awaiting-pickup").toLowerCase();
  if (value === "in transit") return "in-progress";
  if (value === "delivered") return "full";
  return value;
}

function readDeliveries(): Delivery[] {
  try {
    const scheduled = JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]") as Delivery[];
    const partner = JSON.parse(localStorage.getItem("partner_deliveries") || "[]") as Delivery[];
    const merged = [...scheduled, ...partner];
    const byId = new Map<string, Delivery>();
    for (const delivery of merged) {
      if (!delivery?.id) continue;
      byId.set(delivery.id, delivery);
    }
    return Array.from(byId.values()).sort((a, b) => {
      const aDate = new Date(a.createdAt || a.scheduledDate || 0).getTime();
      const bDate = new Date(b.createdAt || b.scheduledDate || 0).getTime();
      return bDate - aDate;
    });
  } catch {
    return [];
  }
}

function writeDeliveries(updated: Delivery[]) {
  localStorage.setItem("scheduled_deliveries", JSON.stringify(updated));
  localStorage.setItem("partner_deliveries", JSON.stringify(updated));
  window.dispatchEvent(new Event("inventoryUpdated"));
}

export function DeliveryConfirmationPage() {
  const { isAdmin } = useSimpleAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>(readDeliveries);

  const pendingConfirmations = useMemo(
    () => deliveries.filter((delivery) => {
      const status = normalizeStatus(delivery.status);
      return status !== "full" && status !== "cancelled";
    }),
    [deliveries],
  );

  function confirmDelivery(id: string) {
    const next = deliveries.map((delivery) => {
      if (delivery.id !== id) return delivery;
      return {
        ...delivery,
        status: "full",
        milestone: "Completed",
        confirmedAt: new Date().toISOString(),
      };
    });
    setDeliveries(next);
    writeDeliveries(next);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate(isAdmin ? "/staff/dashboard" : "/portal")}
          className="mb-6 flex items-center gap-2 text-sm text-[#00C853] transition-colors hover:text-[#00B248]"
        >
          <ArrowLeft size={18} />
          {isAdmin ? "Back to Staff Portal" : "Back to Portal"}
        </button>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Delivery Confirmation</h1>
          <p className="mt-2 text-sm text-gray-600">
            Confirm completed deliveries that were created in Schedule Weekly Delivery so both partner and staff dashboards stay in sync.
          </p>
        </div>

        {pendingConfirmations.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <CheckCircle2 size={42} className="mx-auto mb-3 text-green-500" />
            <p className="text-sm text-gray-600">No deliveries are waiting for confirmation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingConfirmations.map((delivery) => (
              <div key={delivery.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-green-50 p-2">
                      <Truck size={18} className="text-[#00C853]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Delivery #{delivery.id.slice(-6)}</p>
                      <p className="text-xs text-gray-500">{delivery.address || "Address pending"}</p>
                      <p className="text-xs text-gray-500">
                        {delivery.scheduledDate ? new Date(delivery.scheduledDate).toLocaleDateString() : "No date"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 capitalize">
                      {normalizeStatus(delivery.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => confirmDelivery(delivery.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#00C853] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#00B248]"
                    >
                      <CheckCircle2 size={15} />
                      Confirm Delivery
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="flex items-start gap-2 text-xs text-blue-900">
            <AlertCircle size={15} className="mt-0.5" />
            Confirming a delivery marks a scheduled pickup as completed and updates shared delivery tracking for both roles.
          </p>
        </div>
      </div>
    </div>
  );
}
