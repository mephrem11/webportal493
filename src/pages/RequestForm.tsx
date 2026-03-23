import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Send, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a47a578b`;

type RequestItem = {
  item: string;
  quantity: number;
  notes?: string;
};

type ApiRequest = {
  id: string;
  items: RequestItem[];
  urgency: "low" | "medium" | "high";
  notes: string;
};

type RequestsResponse = {
  success: boolean;
  requests: ApiRequest[];
};

type MutationResponse = {
  success: boolean;
  error?: string;
  request?: { id: string };
};

export function RequestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RequestItem[]>([{ item: "", quantity: 1, notes: "" }]);
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [notes, setNotes] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
      if (id) {
        void loadRequest(id, email);
      }
    }
  }, [id]);

  async function loadRequest(requestId: string, email: string) {
    try {
      const res = await fetch(`${API_BASE}/requests/my-requests`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "X-User-Email": email,
        },
      });
      const data = (await res.json()) as RequestsResponse;
      if (data.success) {
        const request = data.requests.find((entry) => entry.id === requestId);
        if (request) {
          setItems(request.items.length > 0 ? request.items : [{ item: "", quantity: 1, notes: "" }]);
          setUrgency(request.urgency);
          setNotes(request.notes);
        }
      }
    } catch (error) {
      console.error("Error loading request:", error);
    }
  }

  function addItem() {
    setItems([...items, { item: "", quantity: 1, notes: "" }]);
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  }

  function updateItem(index: number, field: keyof RequestItem, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  async function saveDraft() {
    setLoading(true);
    try {
      const body = {
        items: items.filter((item) => item.item.trim()),
        urgency,
        notes,
        status: "draft",
        published: false,
      };

      const url = id ? `${API_BASE}/requests/${id}` : `${API_BASE}/requests`;
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          "X-User-Email": userEmail,
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as MutationResponse;
      if (data.success) {
        alert("Request saved as draft!");
        navigate("/portal");
      } else {
        alert(`Error saving request: ${data.error ?? "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving request");
    } finally {
      setLoading(false);
    }
  }

  async function submitRequest() {
    if (items.filter((item) => item.item.trim()).length === 0) {
      alert("Please add at least one item");
      return;
    }

    setLoading(true);
    try {
      const body = {
        items: items.filter((item) => item.item.trim()),
        urgency,
        notes,
      };

      let requestId = id;

      if (!id) {
        const createRes = await fetch(`${API_BASE}/requests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Email": userEmail,
          },
          body: JSON.stringify(body),
        });

        const createData = (await createRes.json()) as MutationResponse;
        if (!createData.success) {
          alert(`Error creating request: ${createData.error ?? "Unknown error"}`);
          return;
        }
        requestId = createData.request?.id;
      } else {
        const updateRes = await fetch(`${API_BASE}/requests/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Email": userEmail,
          },
          body: JSON.stringify(body),
        });

        const updateData = (await updateRes.json()) as MutationResponse;
        if (!updateData.success) {
          alert(`Error updating request: ${updateData.error ?? "Unknown error"}`);
          return;
        }
      }

      const submitRes = await fetch(`${API_BASE}/requests/${requestId}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "X-User-Email": userEmail,
        },
      });

      const submitData = (await submitRes.json()) as MutationResponse;
      if (submitData.success) {
        alert("Request submitted successfully!");
        navigate("/portal");
      } else {
        alert(`Error submitting request: ${submitData.error ?? "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Error submitting request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate("/portal")}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Back to Portal
          </button>
          <h1 className="mb-2 text-4xl font-bold text-gray-800">{id ? "Edit Request" : "New Request"}</h1>
          <p className="text-gray-600">Fill in the details for your goods request</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6">
            <label className="mb-3 block font-bold text-gray-700">Priority Level</label>
            <div className="flex gap-4">
              {(["low", "medium", "high"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setUrgency(level)}
                  className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-all ${
                    urgency === level
                      ? level === "high"
                        ? "bg-red-500 text-white"
                        : level === "medium"
                          ? "bg-yellow-500 text-white"
                          : "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="font-bold text-gray-700">Items Needed</label>
              <button
                onClick={addItem}
                className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={`${item.item}-${index}`} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Item name (e.g., Winter Coats, Canned Food)"
                      value={item.item}
                      onChange={(e) => updateItem(index, "item", e.target.value)}
                      className="mb-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value, 10) || 1)}
                        className="w-24 rounded-lg border border-gray-300 px-4 py-2"
                      />
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={item.notes ?? ""}
                        onChange={(e) => updateItem(index, "notes", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-3 block font-bold text-gray-700">Additional Notes</label>
            <textarea
              placeholder="Any additional information about this request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={saveDraft}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-500 px-6 py-3 text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={submitRequest}
              disabled={loading}
              className="flex flex-1 transform items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50"
            >
              <Send size={20} />
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
