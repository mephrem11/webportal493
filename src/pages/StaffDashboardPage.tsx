import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Users,
  Search,
  FileText,
  Settings,
  BarChart3,
  Truck,
  ArrowRight,
  Calendar,
  LogOut,
  CheckCircle,
  XCircle,
  MinusCircle,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import { StaffSupportRequestManager } from "../components/StaffSupportRequestManager";
import { INVENTORY_CATEGORIES } from "../constants/inventory";
import goodsRecyclingLogo from "../assets/logo.svg";
import { triggerFullSheetsSync } from "../utils/googleSheetsSync";

interface Request {
  id: string;
  title?: string;
  category?: string;
  status: string;
  createdAt: string;
}

interface InventorySummary {
  category: string;
  count: number;
}

interface PartnerAccount {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: "charity_partner" | "admin";
  status: "active" | "pending" | "suspended";
  createdAt: string;
}

interface SharedDelivery {
  id: string;
  status?: string;
  scheduledDate?: string;
  address?: string;
  binAddress?: string;
  drivers?: string;
  milestone?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  contactName?: string;
  createdAt?: string;
}

interface CustomerRecord {
  email: string;
  name: string;
  organization: string;
  status: "active" | "pending" | "suspended";
  requestCount: number;
  lastRequestAt: string;
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

function normalizeMilestone(status: string, milestone: string): string {
  if (milestone) return milestone;
  const normalized = status.toLowerCase();
  if (normalized === "delivered" || normalized === "full") return "Completed";
  if (normalized === "in-transit" || normalized === "in-progress" || normalized === "in progress") return "In Progress";
  if (normalized === "half-full" || normalized === "half full") return "Half Full";
  if (normalized === "cancelled") return "Cancelled";
  return "Awaiting Pickup";
}

function getStoredRequests(): Request[] {
  try {
    return JSON.parse(localStorage.getItem("partner_requests") || "[]") as Request[];
  } catch {
    return [];
  }
}

function buildInventorySummary(): InventorySummary[] {
  try {
    const inv = JSON.parse(localStorage.getItem("staff_inventory") || "[]") as Array<{ category: string }>;
    const summary: Record<string, number> = {};
    for (const item of inv) {
      summary[item.category] = (summary[item.category] || 0) + 1;
    }
    return Object.entries(summary).map(([category, count]) => ({ category, count }));
  } catch {
    return [];
  }
}

function readPartners(): PartnerAccount[] {
  try {
    return JSON.parse(localStorage.getItem("mock_users") || "[]") as PartnerAccount[];
  } catch {
    return [];
  }
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}

function readStaffMembers(): StaffMember[] {
  try {
    return JSON.parse(localStorage.getItem("staff_members") || "[]") as StaffMember[];
  } catch {
    return [];
  }
}

function readSharedDeliveries(): SharedDelivery[] {
  try {
    const scheduledRaw = JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]") as Array<Record<string, unknown>>;
    const partnerRaw = JSON.parse(localStorage.getItem("partner_deliveries") || "[]") as Array<Record<string, unknown>>;
    const mergedRaw = [...scheduledRaw, ...partnerRaw];
    const merged = mergedRaw.map((row, index) => {
      const status = firstText(row, ["status"]) || "scheduled";
      const binAddress = firstText(row, ["binAddress", "bin_address", "address"]);
      const drivers = firstText(row, ["drivers", "driver", "driverName", "driver_name", "contactName", "contact_name"]);
      const milestone = firstText(row, ["milestone", "stage", "step"]);
      const scheduledDate = firstText(row, ["scheduledDate", "scheduled_date", "deliveryDate", "delivery_date", "date"]);
      return {
        id: firstText(row, ["id", "deliveryId", "delivery_id"]) || `delivery-${index + 1}`,
        status,
        scheduledDate,
        address: firstText(row, ["address"]),
        binAddress,
        drivers,
        milestone: normalizeMilestone(status, milestone),
        day: firstText(row, ["day"]),
        startTime: firstText(row, ["startTime", "start_time"]),
        endTime: firstText(row, ["endTime", "end_time"]),
        contactName: firstText(row, ["contactName", "contact_name"]),
        createdAt: firstText(row, ["createdAt", "created_at"]),
      } as SharedDelivery;
    });

    const byId = new Map<string, SharedDelivery>();
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

function readCustomersFromStorage(): CustomerRecord[] {
  const simpleRequests = (() => {
    try {
      return JSON.parse(localStorage.getItem("simple_requests") || "[]") as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  })();

  const mockUsers = (() => {
    try {
      return JSON.parse(localStorage.getItem("mock_users") || "[]") as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  })();

  const userAccounts = (() => {
    try {
      return JSON.parse(localStorage.getItem("user_accounts") || "[]") as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  })();

  const customersByEmail = new Map<string, CustomerRecord>();

  const upsert = (input: Partial<CustomerRecord> & { email: string }) => {
    const email = input.email.trim().toLowerCase();
    if (!email) return;
    const existing = customersByEmail.get(email);
    customersByEmail.set(email, {
      email,
      name: input.name?.trim() || existing?.name || email.split("@")[0] || "Customer",
      organization: input.organization?.trim() || existing?.organization || "Charity Partner",
      status: input.status || existing?.status || "pending",
      requestCount: input.requestCount ?? existing?.requestCount ?? 0,
      lastRequestAt: input.lastRequestAt || existing?.lastRequestAt || "",
    });
  };

  for (const user of mockUsers) {
    const role = String(user.role ?? "").toLowerCase();
    if (role !== "charity_partner") continue;
    const statusRaw = String(user.status ?? "pending").toLowerCase();
    const status: CustomerRecord["status"] =
      statusRaw === "active" || statusRaw === "suspended" ? statusRaw : "pending";
    upsert({
      email: String(user.email ?? ""),
      name: String(user.name ?? ""),
      organization: String(user.organization ?? ""),
      status,
    });
  }

  for (const account of userAccounts) {
    const role = String(account.role ?? "charity_partner").toLowerCase();
    if (role !== "charity_partner") continue;
    const statusRaw = String(account.status ?? "pending").toLowerCase();
    const status: CustomerRecord["status"] =
      statusRaw === "active" || statusRaw === "suspended" ? statusRaw : "pending";
    upsert({
      email: String(account.email ?? ""),
      name: String(account.name ?? ""),
      organization: String(account.organization ?? ""),
      status,
    });
  }

  for (const request of simpleRequests) {
    const email = String(request.partner_email ?? request.email ?? "").trim().toLowerCase();
    if (!email) continue;
    const existing = customersByEmail.get(email);
    const createdAt = String(request.created_at ?? request.createdAt ?? "");
    const requestCount = (existing?.requestCount || 0) + 1;
    const lastRequestAt =
      !existing?.lastRequestAt || (createdAt && new Date(createdAt).getTime() > new Date(existing.lastRequestAt).getTime())
        ? createdAt
        : existing.lastRequestAt;

    upsert({
      email,
      requestCount,
      lastRequestAt,
    });
  }

  return Array.from(customersByEmail.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function StaffDashboardPage() {
  const { user, logout, isAdmin } = useSimpleAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>(getStoredRequests);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary[]>(buildInventorySummary);
  type TabName = "overview" | "customers" | "partners" | "requests" | "support" | "staff";
  const [activeTab, setActiveTab] = useState<TabName>("overview");
  const [partners, setPartners] = useState<PartnerAccount[]>(readPartners);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(readStaffMembers);
  const [sharedDeliveries, setSharedDeliveries] = useState<SharedDelivery[]>(readSharedDeliveries);
  const [customers, setCustomers] = useState<CustomerRecord[]>(readCustomersFromStorage);
  const [customerSearch, setCustomerSearch] = useState("");
  const [syncingCustomers, setSyncingCustomers] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user?.email) {
      navigate("/login");
      return;
    }

    const normalizedEmail = user.email.trim().toLowerCase();
    const isMainAdmin = normalizedEmail === "admin@goodsrecycling.org";
    if (isMainAdmin) return;

    const staffSecurityRaw = localStorage.getItem("staff_security");
    const staffSecurity = staffSecurityRaw
      ? (JSON.parse(staffSecurityRaw) as Array<{ email: string; password?: string; securityQ1?: string }>)
      : [];
    const securityRecord = staffSecurity.find((entry) => entry.email.toLowerCase() === normalizedEmail);
    const hasCompletedSetup = Boolean(
      securityRecord &&
      String(securityRecord.password || "").trim() &&
      String(securityRecord.securityQ1 || "").trim(),
    );

    if (!hasCompletedSetup) {
      navigate("/staff/change-password");
    }
  }, [user, navigate]);

  const formatDeliveryDate = (delivery: SharedDelivery): string => {
    if (!delivery.scheduledDate) return "TBD";
    const parsed = new Date(delivery.scheduledDate);
    if (Number.isNaN(parsed.getTime())) return delivery.scheduledDate;
    const datePart = parsed.toLocaleDateString();
    if (delivery.startTime && delivery.endTime) {
      return `${datePart} (${delivery.startTime}-${delivery.endTime})`;
    }
    return datePart;
  };

  const refreshInventory = useCallback(() => setInventorySummary(buildInventorySummary()), []);
  const refreshPartners = useCallback(() => setPartners(readPartners()), []);
  const refreshDeliveries = useCallback(() => setSharedDeliveries(readSharedDeliveries()), []);
  const refreshCustomers = useCallback(() => setCustomers(readCustomersFromStorage()), []);

  const syncCustomersFromSheets = useCallback(async () => {
    setSyncingCustomers(true);
    try {
      await triggerFullSheetsSync("staff_customers_tab");
      refreshCustomers();
    } finally {
      setSyncingCustomers(false);
    }
  }, [refreshCustomers]);

  useEffect(() => {
    const onUpdate = () => refreshInventory();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "staff_inventory" || e.key === "inventory_items") refreshInventory();
      if (e.key === "mock_users" || e.key === "user_accounts") refreshPartners();
      if (e.key === "scheduled_deliveries" || e.key === "partner_deliveries") refreshDeliveries();
      if (e.key === "simple_requests" || e.key === "mock_users" || e.key === "user_accounts") refreshCustomers();
    };
    window.addEventListener("inventoryUpdated", onUpdate);
    window.addEventListener("focus", refreshDeliveries);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("inventoryUpdated", onUpdate);
      window.removeEventListener("focus", refreshDeliveries);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshInventory, refreshPartners, refreshDeliveries, refreshCustomers]);

  function updatePartnerStatus(id: string, status: PartnerAccount["status"]) {
    const updated = partners.map((p) => (p.id === id ? { ...p, status } : p));
    setPartners(updated);
    localStorage.setItem("mock_users", JSON.stringify(updated));
    try {
      const accounts = JSON.parse(localStorage.getItem("user_accounts") || "[]") as Array<{ email: string; status?: string }>;
      const partner = updated.find((p) => p.id === id);
      if (partner) {
        localStorage.setItem(
          "user_accounts",
          JSON.stringify(accounts.map((a) => a.email === partner.email ? { ...a, status } : a))
        );
      }
    } catch { /* ignore */ }
  }

  function handleInviteStaff(e: React.FormEvent) {
    e.preventDefault();
    setInviteMsg(null);
    const emailTrimmed = inviteEmail.trim().toLowerCase();
    const nameTrimmed = inviteName.trim();
    if (!emailTrimmed || !nameTrimmed) {
      setInviteMsg({ type: "error", text: "Please enter both name and email." });
      return;
    }
    const alreadyExists =
      staffMembers.some((m) => m.email.toLowerCase() === emailTrimmed) ||
      emailTrimmed === "admin@goodsrecycling.org" ||
      emailTrimmed === "staff@goodsrecycling.org";
    if (alreadyExists) {
      setInviteMsg({ type: "error", text: "A staff member with this email already exists." });
      return;
    }
    const newMember: StaffMember = {
      id: Date.now().toString(),
      name: nameTrimmed,
      email: emailTrimmed,
      password: "admin123",
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    const updated = [...staffMembers, newMember];
    localStorage.setItem("staff_members", JSON.stringify(updated));
    setStaffMembers(updated);
    setInviteName("");
    setInviteEmail("");
    setInviteMsg({ type: "success", text: `${newMember.name} added. They can sign in with: ${newMember.email} / admin123, then they will be taken to Password Setup.` });
  }

  function removeStaffMember(id: string) {
    const updated = staffMembers.filter((m) => m.id !== id);
    localStorage.setItem("staff_members", JSON.stringify(updated));
    setStaffMembers(updated);
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const upcomingRequests = [...pendingRequests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
  const supportRequests: unknown[] = JSON.parse(
    localStorage.getItem("support_requests") || "[]"
  );
  const openSupport = (supportRequests as { status: string }[]).filter(
    (s) => s.status === "open"
  );
  const pendingPartners = partners.filter((p) => p.status === "pending");
  const filteredCustomers = customers.filter((customer) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      customer.name.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q) ||
      customer.organization.toLowerCase().includes(q)
    );
  });

  const navCards = [
    {
      label: "Manage Requests",
      desc: "Review and respond to partner requests",
      icon: <FileText size={22} />,
      path: "/staff/manage-requests",
      color: "bg-blue-500",
      badge: pendingRequests.length,
    },
    {
      label: "Inventory",
      desc: "Track available goods",
      icon: <Package size={22} />,
      path: "/staff/inventory",
      color: "bg-green-500",
      badge: null,
    },
    {
      label: "Deliveries",
      desc: "View and manage delivery schedule",
      icon: <Truck size={22} />,
      path: "/partner/deliveries",
      color: "bg-orange-500",
      badge: null,
    },
    {
      label: "Weekly Schedule",
      desc: "Recurring delivery schedule",
      icon: <Calendar size={22} />,
      path: "/weekly-schedule",
      color: "bg-teal-500",
      badge: null,
    },
    {
      label: "Sheets Config",
      desc: "Google Sheets integration",
      icon: <BarChart3 size={22} />,
      path: "/sheets",
      color: "bg-yellow-500",
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E8FFF1] to-[#DDF7E8] text-gray-900 px-6 py-8 border-b border-green-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <img
                src={goodsRecyclingLogo}
                alt="Goods Recycling logo"
                className="h-16 w-auto sm:h-20"
              />
              <div>
              <h1 className="text-2xl font-bold text-gray-950">Staff Dashboard</h1>
              <p className="text-gray-700 text-sm mt-1">
                Welcome back, {user?.name || "Staff Member"}
              </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { logout(); navigate("/"); }}
              className="inline-flex w-fit items-center gap-2 self-start rounded-lg border border-[#00C853] bg-[#00C853] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00B248] sm:self-auto"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
          {(["overview", "customers", "partners", "requests", "support", ...(isAdmin ? ["staff"] : [])] as TabName[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "border-[#009624] bg-[#00C853] text-white shadow-sm"
                  : "border-[#7ADFA0] bg-[#E9FFF1] text-[#006E1B] hover:bg-[#D7FBE6]"
              }`}
            >
              {tab}
              {tab === "partners" && pendingPartners.length > 0 && (
                <span className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingPartners.length}
                </span>
              )}
              {tab === "customers" && customers.length > 0 && (
                <span className="ml-1.5 bg-emerald-700 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {customers.length}
                </span>
              )}
              {tab === "requests" && pendingRequests.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
              {tab === "support" && openSupport.length > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {openSupport.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{pendingRequests.length}</p>
                <p className="text-sm text-gray-600 mt-1">Pending Requests</p>
              </div>
              <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {inventorySummary.reduce((s, c) => s + c.count, 0)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Inventory Items</p>
              </div>
              <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-center">
                <p className="text-3xl font-bold text-orange-600">{openSupport.length}</p>
                <p className="text-sm text-gray-600 mt-1">Open Support Tickets</p>
              </div>
            </div>

            {/* Quick Nav - Partner Accounts card replaced by inline Partners tab */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {navCards.map((card) => (
                <button
                  key={card.path}
                  onClick={() => navigate(card.path)}
                  className="bg-white rounded-xl shadow border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
                >
                  <div
                    className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{card.label}</p>
                      {card.badge !== null && card.badge > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>

            {/* Inventory by Category — live-synced with Google Sheets / Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Inventory by Category</h3>
                  <button
                    type="button"
                    onClick={refreshInventory}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#00C853] transition-colors"
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>
                {inventorySummary.length === 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {INVENTORY_CATEGORIES.map((cat) => (
                      <div key={cat} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-700">0</p>
                        <p className="text-xs text-gray-500">{cat}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {inventorySummary.map(({ category, count }) => (
                      <div key={category} className="bg-green-50 border border-green-100 rounded-lg p-3">
                        <p className="text-xl font-bold text-green-700">{count}</p>
                        <p className="text-xs text-gray-600">{category}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Goods Recycling Delivery Schedule</h3>
                    <p className="text-xs text-gray-500">Staff preview plus customer-facing schedule access</p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshDeliveries}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#00C853] transition-colors"
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>

                {sharedDeliveries.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-gray-500">No deliveries scheduled yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">BIN Address</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Drivers</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery dates</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Milestone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sharedDeliveries.slice(0, 8).map((delivery) => (
                          <tr key={delivery.id}>
                            <td className="px-4 py-2 text-gray-700">{delivery.binAddress || delivery.address || "TBD"}</td>
                            <td className="px-4 py-2 text-gray-700">{delivery.drivers || delivery.contactName || "Unassigned"}</td>
                            <td className="px-4 py-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                                {delivery.status || "scheduled"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-700">{formatDeliveryDate(delivery)}</td>
                            <td className="px-4 py-2 text-gray-700">{delivery.milestone || "Scheduled"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center gap-2 justify-between">
                  <button
                    onClick={() => navigate("/partner/deliveries")}
                    className="text-sm font-medium text-[#00C853] hover:text-[#00B248]"
                  >
                    View Full Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open("/", "_blank", "noopener,noreferrer")}
                    className="rounded-lg border border-[#00C853] bg-[#00C853] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#00B248]"
                  >
                    Open Customer Tab
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-4 flex gap-3 flex-wrap">
              <button
                onClick={() => navigate("/staff/change-password")}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Settings size={16} />
                Change Password
              </button>
              <button
                onClick={() => navigate("/quick-actions")}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Quick Actions
              </button>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Admin View: Upcoming Requests</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("requests")}
                  className="text-xs font-medium text-[#00C853] hover:text-[#00B248]"
                >
                  Open Requests Tab
                </button>
              </div>

              {upcomingRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No pending upcoming requests.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {req.title || req.category || `Request #${req.id.slice(-6)}`}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                        pending
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Customer Directory</h2>
                <p className="text-xs text-gray-500">Searchable charity partner list from Google Sheets synced data and portal accounts.</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search name, email, organization"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-[#00C853] focus:outline-none focus:ring-2 focus:ring-[#00C853]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void syncCustomersFromSheets();
                  }}
                  disabled={syncingCustomers}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#00C853] bg-[#00C853] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00B248] disabled:opacity-60"
                >
                  <RefreshCw size={14} className={syncingCustomers ? "animate-spin" : ""} />
                  Sync From Sheets
                </button>
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <Users size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No customers found for this search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((customer) => (
                  <div key={customer.email} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                        <p className="text-xs text-gray-600 mt-1">{customer.organization}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          customer.status === "active"
                            ? "bg-green-100 text-green-700"
                            : customer.status === "suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {customer.status}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {customer.requestCount} request{customer.requestCount === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          Last: {customer.lastRequestAt ? new Date(customer.lastRequestAt).toLocaleDateString() : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "partners" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Partner Accounts</h2>
              <span className="text-xs text-gray-500">{partners.length} total · {pendingPartners.length} pending approval</span>
            </div>
            {partners.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <Users size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No partner accounts registered yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {partners.map((partner) => (
                  <div key={partner.id} className="bg-white rounded-xl shadow border border-gray-100 p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users size={18} className="text-purple-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{partner.name}</p>
                          <p className="text-xs text-gray-500">{partner.email} · {partner.organization}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          partner.status === "active" ? "bg-green-100 text-green-700"
                          : partner.status === "pending" ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {partner.status}
                        </span>
                        {partner.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => updatePartnerStatus(partner.id, "active")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
                            >
                              <CheckCircle size={13} /> Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePartnerStatus(partner.id, "suspended")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                            >
                              <XCircle size={13} /> Decline
                            </button>
                          </>
                        )}
                        {partner.status === "active" && (
                          <button
                            type="button"
                            onClick={() => updatePartnerStatus(partner.id, "suspended")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            <MinusCircle size={13} /> Suspend
                          </button>
                        )}
                        {partner.status === "suspended" && (
                          <button
                            type="button"
                            onClick={() => updatePartnerStatus(partner.id, "active")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
                          >
                            <CheckCircle size={13} /> Re-activate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Partner Requests
              </h2>
              <button
                onClick={() => navigate("/staff/manage-requests")}
                className="flex items-center gap-1 text-sm text-[#00C853] hover:underline"
              >
                Manage All <ArrowRight size={14} />
              </button>
            </div>
            {requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <FileText size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 10).map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl shadow border border-gray-100 p-4 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {req.title || req.category || `Request #${req.id.slice(-6)}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                          req.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : req.status === "approved" || req.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : req.status === "fulfilled"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {req.status}
                      </span>
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => {
                              try {
                                const all = JSON.parse(localStorage.getItem("simple_requests") || "[]") as Array<Record<string, unknown>>;
                                const updated = all.map((r) => String(r.id) === String(req.id) ? { ...r, status: "approved" } : r);
                                localStorage.setItem("simple_requests", JSON.stringify(updated));
                                setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "approved" } : r));
                              } catch { /* ignore */ }
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              try {
                                const all = JSON.parse(localStorage.getItem("simple_requests") || "[]") as Array<Record<string, unknown>>;
                                const updated = all.map((r) => String(r.id) === String(req.id) ? { ...r, status: "cancelled" } : r);
                                localStorage.setItem("simple_requests", JSON.stringify(updated));
                                setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "cancelled" } : r));
                              } catch { /* ignore */ }
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {(req.status === "approved" || req.status === "scheduled") && (
                        <button
                          onClick={() => {
                            try {
                              const all = JSON.parse(localStorage.getItem("simple_requests") || "[]") as Array<Record<string, unknown>>;
                              const updated = all.map((r) => String(r.id) === String(req.id) ? { ...r, status: "fulfilled" } : r);
                              localStorage.setItem("simple_requests", JSON.stringify(updated));
                              setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "fulfilled" } : r));
                            } catch { /* ignore */ }
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                        >
                          Mark Fulfilled
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "support" && (
          <StaffSupportRequestManager
            staffName={user?.name || "Staff Member"}
            staffEmail={user?.email || "staff@goodsrecycling.org"}
          />
        )}

        {activeTab === "staff" && isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
              <span className="text-xs text-gray-500">
                {1 + staffMembers.length} total (including main admin)
              </span>
            </div>

            {/* Existing staff list */}
            <div className="space-y-3">
              {/* Main admin — always shown */}
              <div className="bg-white rounded-xl shadow border border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Admin User</p>
                    <p className="text-xs text-gray-500">admin@goodsrecycling.org</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                  Main Admin
                </span>
              </div>

              {staffMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-xl shadow border border-gray-100 p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                      Staff
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStaffMember(member.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove staff member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Invite form */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus size={18} className="text-[#00C853]" />
                <h3 className="font-semibold text-gray-800">Invite New Staff Member</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                They will receive the temporary password <span className="font-mono font-semibold text-gray-700">admin123</span> and can change it after first login at{" "}
                <span className="font-mono text-gray-700">/login</span>. Any valid email domain is allowed (Gmail, Yahoo, Hotmail, company email, etc.).
              </p>

              {inviteMsg && (
                <div
                  className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                    inviteMsg.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {inviteMsg.text}
                </div>
              )}

              <form onSubmit={handleInviteStaff} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. jane@goodsrecycling.org"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <UserPlus size={16} />
                  Add Staff Member
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
