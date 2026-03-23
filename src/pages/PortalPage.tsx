import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Truck,
  MessageSquare,
  Repeat,
  FileText,
  User,
  ArrowRight,
  Plus,
  LogOut,
  Calendar,
} from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import goodsRecyclingLogo from "../assets/logo.svg";

interface NavCard {
  label: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  surface: string;
  badge?: number;
}

interface DeliveryItem {
  id: string;
  status: string;
  scheduledDate?: string;
  address?: string;
  createdAt?: string;
}

function readSharedDeliveries(): DeliveryItem[] {
  try {
    const scheduled = JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]") as DeliveryItem[];
    const partner = JSON.parse(localStorage.getItem("partner_deliveries") || "[]") as DeliveryItem[];
    const merged = [...scheduled, ...partner];
    const byId = new Map<string, DeliveryItem>();
    for (const delivery of merged) {
      if (!delivery?.id) continue;
      byId.set(delivery.id, delivery);
    }
    return Array.from(byId.values()).sort((a, b) => {
      const aTime = new Date(a.createdAt || a.scheduledDate || 0).getTime();
      const bTime = new Date(b.createdAt || b.scheduledDate || 0).getTime();
      return bTime - aTime;
    });
  } catch {
    return [];
  }
}

export function PortalPage() {
  const { user, logout } = useSimpleAuth();
  const navigate = useNavigate();
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshToken((prev) => prev + 1);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "scheduled_deliveries" || event.key === "partner_deliveries") {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const myRequests = (() => {
    try {
      return JSON.parse(localStorage.getItem("partner_requests") || "[]") as {
        status: string;
        email: string;
      }[];
    } catch {
      return [];
    }
  })().filter((r) => r.email === user?.email);

  const myDeliveries = useMemo(() => {
    void refreshToken;
    return readSharedDeliveries();
  }, [refreshToken]);

  const mySupportRequests = (() => {
    try {
      return JSON.parse(localStorage.getItem("support_requests") || "[]") as {
        status: string;
        email: string;
      }[];
    } catch {
      return [];
    }
  })().filter((r) => r.email === user?.email);

  const navCards: NavCard[] = [
    {
      label: "New Request",
      desc: "Request goods for your clients",
      icon: <ShoppingBag size={22} />,
      path: "/requests/new",
      color: "bg-emerald-500",
      surface: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
    },
    {
      label: "My Requests",
      desc: "View your submitted requests",
      icon: <FileText size={22} />,
      path: "/my-requests",
      color: "bg-blue-500",
      surface: "bg-blue-50 border-blue-200 hover:border-blue-300",
      badge: myRequests.filter((r) => r.status === "pending").length,
    },
    {
      label: "Schedule Delivery",
      desc: "Set up a new delivery",
      icon: <Plus size={22} />,
      path: "/partner/deliveries/new",
      color: "bg-purple-500",
      surface: "bg-purple-50 border-purple-200 hover:border-purple-300",
    },
    {
      label: "My Deliveries",
      desc: "Track scheduled deliveries",
      icon: <Truck size={22} />,
      path: "/partner/deliveries",
      color: "bg-indigo-500",
      surface: "bg-indigo-50 border-indigo-200 hover:border-indigo-300",
      badge: myDeliveries.filter((d) => d.status === "scheduled").length,
    },
    {
      label: "Submit Support",
      desc: "Get help from our team",
      icon: <MessageSquare size={22} />,
      path: "/support/new",
      color: "bg-orange-500",
      surface: "bg-orange-50 border-orange-200 hover:border-orange-300",
    },
    {
      label: "My Support Tickets",
      desc: "Track your support requests",
      icon: <Calendar size={22} />,
      path: "/support/my-requests",
      color: "bg-yellow-500",
      surface: "bg-yellow-50 border-yellow-200 hover:border-yellow-300",
      badge: mySupportRequests.filter((s) => s.status === "open").length,
    },
    {
      label: "Recurring Wish Lists",
      desc: "Manage recurring needs",
      icon: <Repeat size={22} />,
      path: "/recurring-wishlists",
      color: "bg-teal-500",
      surface: "bg-teal-50 border-teal-200 hover:border-teal-300",
    },
    {
      label: "My Profile",
      desc: "View & edit organization info",
      icon: <User size={22} />,
      path: "/partner/profile",
      color: "bg-pink-500",
      surface: "bg-pink-50 border-pink-200 hover:border-pink-300",
    },
  ];

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00C853] to-[#00A843] text-white px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={goodsRecyclingLogo} alt="Goods Recycling logo" className="h-14 w-auto sm:h-16" />
            <div>
            <h1 className="text-xl font-bold sm:text-2xl">Partner Portal</h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1">
              Welcome back, {user?.name || "Partner"}
            </p>
            {user?.organization && (
              <p className="text-white/60 text-xs mt-0.5">{user.organization}</p>
            )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors sm:w-auto"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-3 sm:gap-4 sm:mb-8">
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">{myRequests.length}</p>
            <p className="text-sm text-gray-600 mt-1">My Requests</p>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">{myDeliveries.length}</p>
            <p className="text-sm text-gray-600 mt-1">Deliveries</p>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-orange-600">{mySupportRequests.length}</p>
            <p className="text-sm text-gray-600 mt-1">Support Tickets</p>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
          {navCards.map((card) => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className={`group flex items-start gap-3 rounded-xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${card.surface}`}
            >
              <div
                className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform`}
              >
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{card.label}</p>
                  {card.badge !== undefined && card.badge > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-medium leading-none">
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{card.desc}</p>
              </div>
              <ArrowRight
                size={14}
                className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1"
              />
            </button>
          ))}
        </div>

        {/* Shared deliveries preview on front page */}
        <div className="mt-8 bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 flex flex-col gap-2 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Delivery Schedule</h2>
              <p className="text-xs text-gray-500">Partners and staff can view the same delivery updates</p>
            </div>
            <button
              onClick={() => navigate("/partner/deliveries")}
              className="text-sm text-[#00C853] hover:text-[#00B248] font-medium"
            >
              View all
            </button>
          </div>

          {myDeliveries.length === 0 ? (
            <div className="px-5 py-8 text-sm text-gray-500">No deliveries scheduled yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myDeliveries.slice(0, 5).map((delivery) => (
                <div key={delivery.id} className="px-4 py-3 flex items-start justify-between gap-3 sm:px-5 sm:items-center sm:gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delivery #{delivery.id.slice(-6)}</p>
                    <p className="text-xs text-gray-500">
                      {delivery.scheduledDate ? new Date(delivery.scheduledDate).toLocaleDateString() : "No date"}
                      {delivery.address ? ` • ${delivery.address}` : ""}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                    {delivery.status || "scheduled"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
