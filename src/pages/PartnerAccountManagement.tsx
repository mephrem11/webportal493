import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Mail,
  Building,
  Shield,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

interface PartnerAccount {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: "charity_partner" | "admin";
  status: "active" | "pending" | "suspended";
  createdAt: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-700",
};

const EMPTY_FORM: {
  name: string;
  email: string;
  organization: string;
  role: PartnerAccount["role"];
  status: PartnerAccount["status"];
} = {
  name: "",
  email: "",
  organization: "",
  role: "charity_partner",
  status: "active",
};

export function PartnerAccountManagement() {
  const navigate = useNavigate();
  const { logout } = useSimpleAuth();
  const [partners, setPartners] = useState<PartnerAccount[]>([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [apiToken] = useState(publicAnonKey);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-a47a578b/partners`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setPartners(data as PartnerAccount[]);
          return;
        }
      } catch {
        // fall through to localStorage
      }
      const stored: PartnerAccount[] = JSON.parse(
        localStorage.getItem("mock_users") || "[]"
      );
      setPartners(stored);
    };
    loadPartners();
  }, [apiToken]);

  const save = (updated: PartnerAccount[]) => {
    setPartners(updated);
    localStorage.setItem("mock_users", JSON.stringify(updated));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const idBase = form.email.trim().toLowerCase().replace(/\s+/g, "-") || "partner";
    const newPartner: PartnerAccount = {
      ...form,
      id: `${idBase}-${partners.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    save([...partners, newPartner]);
    setForm(EMPTY_FORM);
    setShowAddForm(false);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = partners.map((p) =>
      p.id === editingId ? { ...p, ...form } : p
    );
    save(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this partner account?")) return;
    save(partners.filter((p) => p.id !== id));
  };

  const startEdit = (partner: PartnerAccount) => {
    setEditingId(partner.id);
    setForm({
      name: partner.name,
      email: partner.email,
      organization: partner.organization,
      role: partner.role,
      status: partner.status,
    });
    setShowAddForm(false);
  };

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.organization.toLowerCase().includes(q)
    );
  });

  const renderPartnerForm = ({
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
          <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Organization *</label>
          <input
            required
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as PartnerAccount["role"] })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="charity_partner">Charity Partner</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as PartnerAccount["status"] })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
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
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Partner Accounts</h1>
            <p className="text-gray-600">{partners.length} partner organizations</p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              setForm(EMPTY_FORM);
            }}
            className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus size={18} />
            Add Partner
          </button>
        </div>

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {renderPartnerForm({
              onSubmit: handleAdd,
              onCancel: () => setShowAddForm(false),
              label: "Add Partner",
            })}
          </motion.div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <Users size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No partners found</h3>
            <p className="text-gray-500">
              {partners.length === 0
                ? "Add your first partner account."
                : "No partners match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((partner) => (
              <div key={partner.id}>
                {editingId === partner.id ? (
                  renderPartnerForm({
                    onSubmit: handleEditSave,
                    onCancel: () => setEditingId(null),
                    label: "Save Changes",
                  })
                ) : (
                  <div className="bg-white rounded-xl shadow border border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{partner.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail size={12} />
                            {partner.email}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Building size={12} />
                            {partner.organization}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {partner.role === "admin" && (
                        <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          <Shield size={12} />
                          Admin
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          statusColors[partner.status]
                        }`}
                      >
                        {partner.status}
                      </span>
                      <button
                        onClick={() => startEdit(partner)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(partner.id)}
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
