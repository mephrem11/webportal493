import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Package,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowLeft,
  Filter,
  LogOut,
} from "lucide-react";
import { INVENTORY_CATEGORIES } from "../constants/inventory";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import { triggerGoogleSheetsSync } from "../utils/googleSheetsSync";

const CLOTHING_CATEGORIES = new Set([
  "Men's Clothes",
  "Women's Clothes",
  "Jeans",
  "Athletic Clothes",
  "Coats",
]);

const SIZE_OPTIONS: Record<string, string[]> = {
  "Men's Clothes": ["XS", "S", "M", "L", "XL", "XXL"],
  "Women's Clothes": ["XS", "S", "M", "L", "XL", "XXL"],
  "Jeans": ["28", "30", "32", "34", "36", "38", "40"],
  "Athletic Clothes": ["XS", "S", "M", "L", "XL", "XXL"],
  "Coats": ["XS", "S", "M", "L", "XL", "XXL"],
  "Belts": ["S/M", "L/XL", "One Size"],
  "Backpacks": ["Youth", "Standard", "Large"],
  "Sleeping Bags": ["Youth", "Regular", "XL"],
  "Towels": ["Washcloth", "Hand", "Bath"],
  "Household Items": ["Small", "Medium", "Large", "One Size"],
};

function getSizeOptions(category: string): string[] {
  return SIZE_OPTIONS[category] ?? ["One Size"];
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  size: string;
  quantity: number;
  condition: "new" | "good" | "fair" | "poor";
  notes?: string;
  lastUpdated: string;
}

const conditionColors: Record<string, string> = {
  new: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-red-100 text-red-700",
};

const EMPTY_ITEM: Omit<InventoryItem, "id" | "lastUpdated"> = {
  name: "",
  category: INVENTORY_CATEGORIES[0],
  size: getSizeOptions(INVENTORY_CATEGORIES[0])[0],
  quantity: 1,
  condition: "good",
  notes: "",
};

export function StaffInventory() {
  const navigate = useNavigate();
  const { logout } = useSimpleAuth();
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const staffRaw = localStorage.getItem("staff_inventory");
      if (staffRaw) {
        return JSON.parse(staffRaw) as InventoryItem[];
      }

      // Fallback for older/newer portal flows that persist only partner inventory.
      const partnerRaw = localStorage.getItem("inventory_items");
      if (partnerRaw) {
        const partnerItems = JSON.parse(partnerRaw) as Array<{
          id: string;
          category: string;
          size?: string;
          quantity: number;
          condition: "new" | "good" | "fair" | "poor";
          location?: string;
          lastUpdated?: string;
        }>;

        return partnerItems.map((item, index) => ({
          id: item.id || `item-${index + 1}`,
          name: item.category,
          category: item.category,
          size: item.size || "One Size",
          quantity: item.quantity,
          condition: item.condition,
          notes: item.location || "",
          lastUpdated: item.lastUpdated || new Date().toISOString(),
        }));
      }

      return [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<InventoryItem, "id" | "lastUpdated">>(EMPTY_ITEM);

  const save = (updated: InventoryItem[]) => {
    setItems(updated);
    localStorage.setItem("staff_inventory", JSON.stringify(updated));

    // Keep partner portal inventory in sync.
    const partnerItems = updated.map((item) => ({
      id: item.id,
      category: item.category,
      size: item.size,
      color: "",
      condition: item.condition,
      quantity: item.quantity,
      location: item.notes || "",
      lastUpdated: item.lastUpdated,
    }));
    localStorage.setItem("inventory_items", JSON.stringify(partnerItems));
    window.dispatchEvent(new Event("inventoryUpdated"));
    void triggerGoogleSheetsSync("inventory_updated");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const idBase = form.name.trim().toLowerCase().replace(/\s+/g, "-") || "item";
    const newItem: InventoryItem = {
      ...form,
      id: `${idBase}-${items.length + 1}`,
      lastUpdated: new Date().toISOString(),
    };
    save([...items, newItem]);
    setForm(EMPTY_ITEM);
    setShowAddForm(false);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = items.map((it) =>
      it.id === editingId
        ? { ...it, ...form, lastUpdated: new Date().toISOString() }
        : it
    );
    save(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    save(items.filter((it) => it.id !== id));
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      size: item.size || getSizeOptions(item.category)[0],
      quantity: item.quantity,
      condition: item.condition,
      notes: item.notes || "",
    });
    setShowAddForm(false);
  };

  const filtered = items.filter((it) => {
    const matchSearch =
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      filterCategory === "All" || it.category === filterCategory;
    return matchSearch && matchCat;
  });

  const renderItemForm = ({
    onSubmit,
    onCancel,
    submitLabel,
  }: {
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
  }) => (
    <form onSubmit={onSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => {
              const newCat = e.target.value;
              setForm({ ...form, category: newCat, size: getSizeOptions(newCat)[0] });
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
          >
            {INVENTORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Size *</label>
          <select
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
          >
            {getSizeOptions(form.category).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
          <input
            type="number"
            min={0}
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Condition *</label>
          <select
            value={form.condition}
            onChange={(e) =>
              setForm({ ...form, condition: e.target.value as InventoryItem["condition"] })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
          >
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex items-center gap-1 bg-[#00C853] hover:bg-[#00B248] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Check size={16} />
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/staff/dashboard")}
            className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] transition-colors text-sm"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => { logout(); navigate("/"); }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#00C853] bg-[#00C853] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00B248]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">{items.length} items tracked</p>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); setForm(EMPTY_ITEM); }}
            className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6">
            {renderItemForm({
              onSubmit: handleAdd,
              onCancel: () => setShowAddForm(false),
              submitLabel: "Add Item",
            })}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
            >
              <option value="All">All Categories</option>
              {INVENTORY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Items List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <Package size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No items found</h3>
            <p className="text-gray-500">
              {items.length === 0
                ? "Add your first inventory item using the button above."
                : "No items match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id}>
                {editingId === item.id ? (
                  renderItemForm({
                    onSubmit: handleEditSave,
                    onCancel: () => setEditingId(null),
                    submitLabel: "Save Changes",
                  })
                ) : (
                  <div className="bg-white rounded-xl shadow border border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-[#00C853]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.category}{CLOTHING_CATEGORIES.has(item.category) || item.size ? ` · ${item.size}` : ""} · Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${conditionColors[item.condition]}`}>
                        {item.condition}
                      </span>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
