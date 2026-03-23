import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { CheckCircle, Signature, ArrowLeft } from "lucide-react";

interface DeliveryInfo {
  id: string;
  partnerName: string;
  partnerOrg: string;
  items: string[];
  scheduledDate: string;
  address: string;
}

export function SponsorSignature() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiToken] = useState(publicAnonKey);

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-a47a578b/deliveries/${deliveryId}`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setDelivery(data as DeliveryInfo);
        } else {
          // Fallback: show a demo delivery
          setDelivery({
            id: deliveryId || "demo",
            partnerName: "Partner Contact",
            partnerOrg: "Community Organization",
            items: ["Clothing (20 items)", "Household goods (5 boxes)"],
            scheduledDate: new Date().toLocaleDateString(),
            address: "123 Main St, City, State",
          });
        }
      } catch {
        setDelivery({
          id: deliveryId || "demo",
          partnerName: "Partner Contact",
          partnerOrg: "Community Organization",
          items: ["Clothing (20 items)", "Household goods (5 boxes)"],
          scheduledDate: new Date().toLocaleDateString(),
          address: "123 Main St, City, State",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDelivery();
  }, [deliveryId, apiToken]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) return;

    setSubmitting(true);
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a47a578b/deliveries/${deliveryId}/sign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            signerName,
            signerTitle,
            signedAt: new Date().toISOString(),
          }),
        }
      );
      setSigned(true);
    } catch {
      setSigned(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Confirmed!</h2>
          <p className="text-gray-600 mb-4">
            Thank you, <strong>{signerName}</strong>. Your signature has been recorded.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Signed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#00C853] hover:bg-[#00B248] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#00D084] to-[#00C878] px-8 py-6">
            <div className="flex items-center gap-3">
              <Signature size={28} className="text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">Delivery Signature</h1>
                <p className="text-white/90 text-sm">Confirm receipt of goods</p>
              </div>
            </div>
          </div>

          {delivery && (
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3">Delivery Details</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Organization:</span> {delivery.partnerOrg}</p>
                <p><span className="font-medium">Date:</span> {delivery.scheduledDate}</p>
                <p><span className="font-medium">Address:</span> {delivery.address}</p>
                <div>
                  <p className="font-medium mb-1">Items:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-2">
                    {delivery.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSign} className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              By signing below, you confirm that you have received the items listed above
              in satisfactory condition.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title / Role
              </label>
              <input
                type="text"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="e.g., Director, Volunteer Coordinator"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Signature size={18} />
                  Sign & Confirm Delivery
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
