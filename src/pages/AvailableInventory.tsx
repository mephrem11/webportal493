import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { INVENTORY_CATEGORIES } from "../constants/inventory";

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

function readInventoryFromStorage(): InventoryItem[] {
  try {
    return JSON.parse(localStorage.getItem("inventory_items") || "[]") as InventoryItem[];
  } catch {
    return [];
  }
}

export function AvailableInventory() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>(readInventoryFromStorage);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const onUpdate = () => setItems(readInventoryFromStorage());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "inventory_items") {
        setItems(readInventoryFromStorage());
      }
    };
    window.addEventListener("inventoryUpdated", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("inventoryUpdated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const filtered = items
    .filter((item) => selectedCategory === "All" || item.category === selectedCategory)
    .filter(
      (item) =>
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.size.toLowerCase().includes(search.toLowerCase()) ||
        (item.color ?? "").toLowerCase().includes(search.toLowerCase()) ||
        item.condition.toLowerCase().includes(search.toLowerCase())
    );

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginated = filtered.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[#E8E3DC]">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <button
          onClick={() => navigate("/portal")}
          className="flex items-center gap-2 text-[#2E7D5E] hover:text-[#246B4E] mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back to Portal
        </button>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 sm:px-6">
            <div className="flex items-center gap-3 mb-1">
              <Package className="text-blue-600" size={26} />
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Available Inventory</h1>
            </div>
            <p className="text-sm text-gray-600">Browse goods currently available at the Goods Recycling warehouse</p>
          </div>

          {/* Filters */}
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 gap-4 sm:px-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="All">All Categories</option>
                {INVENTORY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter by category, size, color, condition…"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-white border-b border-gray-100 sm:px-6">
            <p className="text-sm text-gray-500">{filtered.length} item{filtered.length !== 1 ? "s" : ""} found</p>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-200 md:hidden">
            {paginated.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Package size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {items.length === 0
                    ? "No inventory items available yet."
                    : "No items match your search."}
                </p>
              </div>
            ) : (
              paginated.map((item) => (
                <div key={item.id} className="px-4 py-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.category}</p>
                    <span className={`text-sm font-semibold ${item.quantity > 0 ? "text-green-700" : "text-red-500"}`}>
                      Qty {item.quantity}
                    </span>
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

          {/* Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200">
                <tr>
                  {["Category", "Size", "Color", "Condition", "Qty Available", "Location", "Last Updated"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Package size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        {items.length === 0
                          ? "No inventory items available yet."
                          : "No items match your search."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.size}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.color || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.condition}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${item.quantity > 0 ? "text-green-700" : "text-red-500"}`}>
                          {item.quantity}
                        </span>
                      </td>
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

          {/* Pagination controls */}
          <div className="px-4 py-4 border-t border-gray-200 bg-white flex flex-col gap-3 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                {[15, 25, 45, 50, 95, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {totalItems === 0 ? "0 of 0" : `${startIndex + 1}-${endIndex} of ${totalItems}`}
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-gray-300 text-gray-600 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-gray-300 text-gray-600 disabled:opacity-40"
                aria-label="Next page"
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
