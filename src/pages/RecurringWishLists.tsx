import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  ArrowLeft,
  Plus,
  Repeat,
  Package,
  Calendar,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

interface WishListItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  frequency: "weekly" | "monthly" | "quarterly";
  priority: "low" | "normal" | "high";
  isActive: boolean;
  lastFulfilled?: string;
}

const CATEGORIES = [
  "Clothing - Men's",
  "Clothing - Women's",
  "Clothing - Children's",
  "Household Items",
  "Bedding",
  "Towels",
  "Backpacks",
  "Shoes",
  "Hygiene Products",
  "Other",
];

const EMPTY_ITEM: Omit<WishListItem, "id"> = {
  category: CATEGORIES[0],
  description: "",
  quantity: 1,
  frequency: "monthly",
  priority: "normal",
  isActive: true,
};

export function RecurringWishLists() {
  const [items, setItems] = useState<WishListItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<WishListItem, "id">>(EMPTY_ITEM);
  const [apiToken] = useState(publicAnonKey);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-a47a578b/recurring-wishlists`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setItems(data as WishListItem[]);
          return;
        }
      } catch {
        // fall through to localStorage
      }
      const stored: WishListItem[] = JSON.parse(
        localStorage.getItem("recurring_wishlists") || "[]"
      );
      setItems(stored);
    };
    loadItems();
  }, [apiToken]);

  const saveItems = (updated: WishListItem[]) => {
    setItems(updated);
    localStorage.setItem("recurring_wishlists", JSON.stringify(updated));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const idBase = form.category.trim().toLowerCase().replace(/\s+/g, "-") || "item";
    const newItem: WishListItem = { ...form, id: `${idBase}-${items.length + 1}` };
    saveItems([...items, newItem]);
    setForm(EMPTY_ITEM);
    setShowForm(false);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = items.map((it) =>
      it.id === editingId ? { ...it, ...form } : it
    );
    saveItems(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this recurring item?")) return;
    saveItems(items.filter((it) => it.id !== id));
  };

  const toggleActive = (id: string) => {
    const updated = items.map((it) =>
      it.id === id ? { ...it, isActive: !it.isActive } : it
    );
    saveItems(updated);
  };

  const startEdit = (item: WishListItem) => {
    setEditingId(item.id);
    setForm({ ...item });
    setShowForm(false);
  };

  const frequencyLabels: Record<string, string> = {
    weekly: "Every week",
    monthly: "Every month",
    quarterly: "Every quarter",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    normal: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
  };

  const renderItemForm = ({
    onSubmit,
    onCancel,
    label,
  }: {
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    label: string;
  }) => (
    <form
      onSubmit={onSubmit}
      className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
          <input
            type="number"
            min={1}
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Frequency *</label>
          <select
            value={form.frequency}
            onChange={(e) =>
              setForm({ ...form, frequency: e.target.value as WishListItem["frequency"] })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Priority *</label>
          <select
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: e.target.value as WishListItem["priority"] })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="Any specific requirements or notes..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex items-center gap-1 bg-[#00C853] hover:bg-[#00B248] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Check size={14} />
          {label}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link
          to="/portal"
          className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          Back to Portal
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recurring Wish Lists</h1>
            <p className="text-gray-600">Set up automatic recurring item requests</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_ITEM); }}
            className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>

        {showForm && (
          <div className="mb-6">
            {renderItemForm({
              onSubmit: handleAdd,
              onCancel: () => setShowForm(false),
              label: "Add to List",
            })}
          </div>
        )}

        {items.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <Repeat size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No recurring items</h3>
            <p className="text-gray-500">
              Add items that you need on a recurring basis.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {editingId === item.id ? (
                  renderItemForm({
                    onSubmit: handleEditSave,
                    onCancel: () => setEditingId(null),
                    label: "Save Changes",
                  })
                ) : (
                  <div
                    className={`bg-white rounded-xl shadow border p-4 flex items-center justify-between ${
                      item.isActive ? "border-gray-100" : "border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-[#00C853]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.category}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {item.quantity} items ·
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={12} />
                            {frequencyLabels[item.frequency]}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          priorityColors[item.priority]
                        }`}
                      >
                        {item.priority}
                      </span>
                      <button
                        onClick={() => toggleActive(item.id)}
                        title={item.isActive ? "Pause" : "Resume"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.isActive
                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                            : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <Repeat size={16} />
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
