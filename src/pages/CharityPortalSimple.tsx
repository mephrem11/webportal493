import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import { Package, FileText, Calendar, MessageSquare, Truck, Search, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { triggerGoogleSheetsSync } from "../utils/googleSheetsSync";
import goodsRecyclingLogo from "../assets/logo.svg";
import { INVENTORY_CATEGORIES } from "../constants/inventory";

interface Request {
  id: string;
  item_type: string;
  quantity: number;
  pickup_address: string;
  notes: string;
  status: "scheduled" | "pending" | "cancelled";
  delivery_date?: string;
  partner_email?: string;
  created_at: string;
}

interface InventoryItem {
  id: string;
  category: string;
  size: string;
  color: string;
  condition: string;
  quantity: number;
  location: string;
  lastUpdated: string;
}

interface SharedDelivery {
  id: string;
  status?: string;
  scheduledDate?: string;
  address?: string;
  createdAt?: string;
}

function readSharedDeliveries(): SharedDelivery[] {
  try {
    const scheduled = JSON.parse(localStorage.getItem("scheduled_deliveries") || "[]") as SharedDelivery[];
    const partner = JSON.parse(localStorage.getItem("partner_deliveries") || "[]") as SharedDelivery[];
    const merged = [...scheduled, ...partner];
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

export function CharityPortalSimple() {
  const { user, isAuthenticated, logout, loading: authLoading } = useSimpleAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>(() => {
    try {
      const saved = localStorage.getItem("simple_requests");
      const allRequests = saved ? (JSON.parse(saved) as Request[]) : [];
      return allRequests.filter((req) => req.partner_email === user?.email);
    } catch {
      return [];
    }
  });

  // New request form state
  const [itemType, setItemType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Inventory state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageSize, setInventoryPageSize] = useState(25);
  const [deliveryRefreshToken, setDeliveryRefreshToken] = useState(0);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("inventory_items");
      return saved ? (JSON.parse(saved) as InventoryItem[]) : [];
    } catch {
      return [];
    }
  });

  const loadRequests = useCallback(() => {
    try {
      const saved = localStorage.getItem("simple_requests");
      if (saved) {
        const allRequests = JSON.parse(saved) as Request[];
        setRequests(allRequests.filter((req) => req.partner_email === user?.email));
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  }, [user?.email]);

  const loadInventory = useCallback(() => {
    try {
      const saved = localStorage.getItem("inventory_items");
      if (saved) setInventoryItems(JSON.parse(saved) as InventoryItem[]);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    }
  }, []);

  // Listen for inventory updates
  useEffect(() => {
    const handleInventoryUpdate = () => { loadInventory(); };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "inventory_items") loadInventory();
    };
    window.addEventListener("inventoryUpdated", handleInventoryUpdate);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadInventory]);

  useEffect(() => {
    const refresh = () => setDeliveryRefreshToken((prev) => prev + 1);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "scheduled_deliveries" || event.key === "partner_deliveries") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!user?.email) return;
    try {
      const accounts = JSON.parse(localStorage.getItem("user_accounts") || "[]") as Array<{ email: string; status?: string }>;
      const account = accounts.find((a) => a.email.toLowerCase() === user.email.toLowerCase());
      const status = account?.status;
      if (status === "pending" || status === "suspended") {
        navigate("/my-account");
      }
    } catch {
      // ignore and allow portal rendering
    }
  }, [navigate, user?.email]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemType || !quantity || !pickupAddress) {
      alert("Please fill in all required fields");
      return;
    }
    const newRequest: Request = {
      id: Date.now().toString(),
      item_type: itemType,
      quantity: parseInt(quantity),
      pickup_address: pickupAddress,
      notes,
      status: "pending",
      partner_email: user?.email,
      created_at: new Date().toISOString(),
    };
    try {
      const saved = localStorage.getItem("simple_requests");
      const allRequests: Request[] = saved ? JSON.parse(saved) : [];
      allRequests.push(newRequest);
      localStorage.setItem("simple_requests", JSON.stringify(allRequests));
      void triggerGoogleSheetsSync("partner_request_created");
      loadRequests();
      setItemType(""); setQuantity(""); setPickupAddress(""); setNotes("");
    } catch (err) {
      console.error("Failed to save request:", err);
      alert("Failed to submit request");
    }
  }

  function handleEdit(request: Request) {
    setEditingId(request.id);
    setItemType(request.item_type);
    setQuantity(request.quantity.toString());
    setPickupAddress(request.pickup_address);
    setNotes(request.notes);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    try {
      const saved = localStorage.getItem("simple_requests");
      const allRequests: Request[] = saved ? JSON.parse(saved) : [];
      const updated = allRequests.map((req) =>
        req.id === editingId
          ? { ...req, item_type: itemType, quantity: parseInt(quantity), pickup_address: pickupAddress, notes }
          : req
      );
      localStorage.setItem("simple_requests", JSON.stringify(updated));
      void triggerGoogleSheetsSync("partner_request_updated");
      loadRequests();
      setEditingId(null); setItemType(""); setQuantity(""); setPickupAddress(""); setNotes("");
    } catch (err) {
      console.error("Failed to update request:", err);
    }
  }

  function cancelEdit() {
    setEditingId(null); setItemType(""); setQuantity(""); setPickupAddress(""); setNotes("");
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-700 border border-blue-300";
      case "pending":   return "bg-yellow-100 text-yellow-700 border border-yellow-300";
      case "cancelled": return "bg-red-100 text-red-700 border border-red-300";
      default:          return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  }

  function filterInventory() {
    return inventoryItems
      .filter((item) => selectedCategory === "All" || item.category === selectedCategory)
      .filter(
        (item) =>
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.condition.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }

  const filteredInventory = filterInventory();
  const browseCategories = useMemo(() => {
    const configured = INVENTORY_CATEGORIES.map((category) => String(category));
    const configuredSet = new Set<string>(configured);
    const extras = Array.from(
      new Set(inventoryItems.map((item) => item.category).filter((category) => category && !configuredSet.has(category))),
    ).sort((a, b) => a.localeCompare(b));
    return [...configured, ...extras];
  }, [inventoryItems]);
  const totalInventory = filteredInventory.length;
  const totalInventoryPages = Math.max(1, Math.ceil(totalInventory / inventoryPageSize));
  const safeInventoryPage = Math.min(inventoryPage, totalInventoryPages);
  const inventoryStart = (safeInventoryPage - 1) * inventoryPageSize;
  const inventoryEnd = Math.min(inventoryStart + inventoryPageSize, totalInventory);
  const paginatedInventory = filteredInventory.slice(inventoryStart, inventoryEnd);
  const sharedDeliveries = useMemo(() => {
    void deliveryRefreshToken;
    return readSharedDeliveries();
  }, [deliveryRefreshToken]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/95 border-b border-slate-300 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={goodsRecyclingLogo} alt="Goods Recycling logo" className="h-16 w-auto md:h-20" />
            <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">Charity Partner Portal</h1>
            <p className="text-xs text-gray-500 sm:text-sm">Welcome, {user?.name || user?.email}</p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto md:flex md:items-center md:gap-3">
            <Link
              to="/my-account"
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200"
            >
              My Account
            </Link>
            <Link
              to="/change-password"
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200"
            >
              Change Password
            </Link>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="rounded-lg border border-[#00C853] bg-[#00C853] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00B248]"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Quick Access Links */}
        <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 md:gap-4">
          <Link
            to="/available-inventory"
            className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-100 p-4 text-emerald-950 shadow-md transition-all hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-lg"
          >
            <Package size={24} className="text-emerald-700" />
            <div>
              <div className="font-semibold">Available Inventory</div>
              <div className="text-xs text-emerald-800">Browse goods</div>
            </div>
          </Link>

          <Link
            to="/deliveries"
            className="flex items-center gap-3 rounded-lg border border-blue-300 bg-blue-100 p-4 text-blue-950 shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-200 hover:shadow-lg"
          >
            <Truck size={24} className="text-blue-700" />
            <div>
              <div className="font-semibold">Deliveries</div>
              <div className="text-xs text-blue-800">Track deliveries</div>
            </div>
          </Link>

          <Link
            to="/schedule-delivery"
            className="flex items-center gap-3 rounded-lg border border-cyan-400 bg-cyan-300 p-4 text-gray-950 shadow-md transition-all hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-lg"
          >
            <Calendar size={24} className="text-black" />
            <div>
              <div className="font-semibold text-black">Schedule Weekly Delivery</div>
              <div className="text-xs text-black">Set a recurring weekly pickup time for your organization</div>
            </div>
          </Link>

          <Link
            to="/my-requests"
            className="flex items-center gap-3 rounded-lg border border-violet-300 bg-violet-100 p-4 text-violet-950 shadow-md transition-all hover:-translate-y-0.5 hover:bg-violet-200 hover:shadow-lg"
          >
            <FileText size={24} className="text-violet-700" />
            <div>
              <div className="font-semibold">My Requests</div>
              <div className="text-xs text-violet-800">View all requests</div>
            </div>
          </Link>

          <Link
            to="/submit-support-request"
            className="flex items-center gap-3 rounded-lg border border-orange-300 bg-orange-100 p-4 text-orange-950 shadow-md transition-all hover:-translate-y-0.5 hover:bg-orange-200 hover:shadow-lg"
          >
            <MessageSquare size={24} className="text-orange-700" />
            <div>
              <div className="font-semibold">Support Request</div>
              <div className="text-xs text-orange-800">Get help</div>
            </div>
          </Link>

          <Link
            to="/recurring-wishlists"
            className="flex items-center gap-3 rounded-lg border border-teal-300 bg-teal-100 p-4 text-teal-950 shadow-md transition-all hover:-translate-y-0.5 hover:bg-teal-200 hover:shadow-lg"
          >
            <Repeat size={24} className="text-teal-700" />
            <div>
              <div className="font-semibold">Recurring Wish Lists</div>
              <div className="text-xs text-teal-800">Weekly recurring requests</div>
            </div>
          </Link>

          <Link
            to="/weekly-schedule"
            className="flex items-center gap-3 rounded-lg border border-fuchsia-300 bg-fuchsia-100 p-4 text-fuchsia-950 shadow-md transition-all hover:-translate-y-0.5 hover:bg-fuchsia-200 hover:shadow-lg"
          >
            <Calendar size={24} className="text-fuchsia-700" />
            <div>
              <div className="font-semibold">Weekly Schedule</div>
              <div className="text-xs text-fuchsia-800">Delivery calendar and dates</div>
            </div>
          </Link>

          <Link
            to="/delivery-confirmations"
            className="flex items-center gap-3 rounded-lg border border-lime-300 bg-lime-100 p-4 text-lime-950 shadow-md transition-all hover:-translate-y-0.5 hover:bg-lime-200 hover:shadow-lg"
          >
            <Truck size={24} className="text-lime-700" />
            <div>
              <div className="font-semibold">Delivery Confirmation</div>
              <div className="text-xs text-lime-800">Confirm completed deliveries for scheduled pickups</div>
            </div>
          </Link>
        </div>

        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 flex flex-col gap-3 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img src={goodsRecyclingLogo} alt="Goods Recycling logo" className="h-12 w-auto sm:h-14" />
              <div>
              <h2 className="text-lg font-bold text-gray-900">Delivery Schedule</h2>
              <p className="text-xs text-gray-500">Partners can view the same live schedule from their portal side</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/partner/deliveries")}
              className="text-left text-sm font-medium text-[#2E7D5E] hover:text-[#246B4E] sm:text-right"
            >
              View all
            </button>
          </div>

          {sharedDeliveries.length === 0 ? (
            <div className="px-6 py-8 text-sm text-gray-500">No deliveries scheduled yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sharedDeliveries.slice(0, 5).map((delivery) => (
                <div key={delivery.id} className="px-4 py-3 flex items-center justify-between gap-4 sm:px-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: New Request Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">New Request</h2>

              <form onSubmit={editingId ? handleUpdate : handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Canned Food"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 123 Main St, McLean VA"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    placeholder="Any additional details"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] text-gray-900 placeholder-gray-400 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    className="flex-1 bg-[#2E7D5E] hover:bg-[#266B50] text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                  >
                    {editingId ? "Update Request" : "Submit Request"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right: My Requests Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-200 sm:px-6">
                <h2 className="text-xl font-bold text-gray-900">My Requests</h2>
              </div>

              <div className="divide-y divide-gray-200 md:hidden">
                {requests.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No requests yet. Submit your first request using the form.
                  </div>
                ) : (
                  requests.map((request) => (
                    <div key={request.id} className="px-4 py-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{request.item_type}</p>
                        <span className={`px-2.5 py-1 rounded text-xs font-medium capitalize ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p><span className="font-medium text-gray-700">Quantity:</span> {request.quantity}</p>
                        <p><span className="font-medium text-gray-700">Delivery:</span> {request.delivery_date || "—"}</p>
                        <p><span className="font-medium text-gray-700">Notes:</span> {request.notes || "—"}</p>
                      </div>
                      {request.status === "pending" && (
                        <button
                          onClick={() => handleEdit(request)}
                          className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Edit Request
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["Item", "Qty", "Status", "Notes", "Delivery", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No requests yet. Submit your first request using the form.
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">{request.item_type}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{request.quantity}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded text-xs font-medium capitalize ${getStatusBadge(request.status)}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{request.notes || "—"}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{request.delivery_date || "—"}</td>
                          <td className="px-4 py-4 text-sm">
                            {request.status === "pending" ? (
                              <button
                                onClick={() => handleEdit(request)}
                                className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Edit
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Browse Available Goods */}
        <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 sm:px-6">
            <div className="flex items-center gap-3 mb-1">
              <Package className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Browse Available Goods</h2>
            </div>
            <p className="text-sm text-gray-600">View current inventory at Goods Recycling warehouse</p>
          </div>

          {/* Filters */}
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 gap-4 sm:px-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setInventoryPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="All">All Categories</option>
                {browseCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setInventoryPage(1);
                  }}
                  placeholder="Filter by category, size, color, condition..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="divide-y divide-gray-200 md:hidden">
            {paginatedInventory.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                {inventoryItems.length === 0
                  ? "No inventory items available yet."
                  : "No items match your search."}
              </div>
            ) : (
              paginatedInventory.map((item) => (
                <div key={item.id} className="px-4 py-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.category}</p>
                    <p className="text-sm font-semibold text-gray-900">Qty: {item.quantity}</p>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><span className="font-medium text-gray-700">Size:</span> {item.size}</p>
                    <p><span className="font-medium text-gray-700">Color:</span> {item.color || "—"}</p>
                    <p><span className="font-medium text-gray-700">Condition:</span> {item.condition}</p>
                    <p><span className="font-medium text-gray-700">Location:</span> {item.location || "—"}</p>
                    <p><span className="font-medium text-gray-700">Last Updated:</span> {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : "—"}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200">
                <tr>
                  {["Category", "Size", "Color", "Condition", "Qty", "Location", "Last Updated"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {inventoryItems.length === 0
                        ? "No inventory items available yet."
                        : "No items match your search."}
                    </td>
                  </tr>
                ) : (
                  paginatedInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.size}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.color || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.condition}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.location || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 bg-white flex flex-col gap-3 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <select
                value={inventoryPageSize}
                onChange={(e) => {
                  setInventoryPageSize(Number(e.target.value));
                  setInventoryPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                {[15, 25, 45, 50, 95, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {totalInventory === 0 ? "0 of 0" : `${inventoryStart + 1}-${inventoryEnd} of ${totalInventory}`}
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setInventoryPage(Math.max(1, safeInventoryPage - 1))}
                disabled={safeInventoryPage <= 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-gray-300 text-gray-600 disabled:opacity-40"
                aria-label="Previous inventory page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setInventoryPage(Math.min(totalInventoryPages, safeInventoryPage + 1))}
                disabled={safeInventoryPage >= totalInventoryPages}
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-gray-300 text-gray-600 disabled:opacity-40"
                aria-label="Next inventory page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
