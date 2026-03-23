import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  ArrowLeft,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Save,
  CheckCircle,
} from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

interface ProfileData {
  name: string;
  organization: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  description: string;
}

export function PartnerProfile() {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>({
    name: user?.name || "",
    organization: user?.organization || "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: user?.email || "",
    website: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [apiToken] = useState(publicAnonKey);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-a47a578b/partner-profile`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setProfile((prev) => ({ ...prev, ...(data as Partial<ProfileData>) }));
          return;
        }
      } catch {
        // fall through to localStorage
      }
      const stored = localStorage.getItem(`partner_profile_${user?.email}`);
      if (stored) {
        try {
          setProfile((prev) => ({ ...prev, ...JSON.parse(stored) }));
        } catch {
          // ignore
        }
      }
    };
    loadProfile();
  }, [user?.email, apiToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a47a578b/partner-profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify(profile),
        }
      );
      localStorage.setItem(`partner_profile_${user?.email}`, JSON.stringify(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      localStorage.setItem(`partner_profile_${user?.email}`, JSON.stringify(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/portal")}
          className="flex items-center gap-2 text-[#00C853] hover:text-[#00B248] mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          Back to Portal
        </button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#00D084] to-[#00C878] px-8 py-6">
            <div className="flex items-center gap-3">
              <User size={28} className="text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Partner Profile</h1>
                <p className="text-white/90 text-sm">
                  Manage your organization's information
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <CheckCircle size={16} />
                Profile saved successfully!
              </div>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={14} className="inline mr-1" />
                  Contact Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
                  Organization *
                </label>
                <input
                  type="text"
                  required
                  value={profile.organization}
                  onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Street Address
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="123 Main Street"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  maxLength={2}
                  placeholder="VA"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                <input
                  type="text"
                  value={profile.zip}
                  onChange={(e) => setProfile({ ...profile, zip: e.target.value })}
                  maxLength={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone size={14} className="inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="(555) 555-5555"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail size={14} className="inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://yourorg.org"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Description
              </label>
              <textarea
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                rows={4}
                placeholder="Brief description of your organization's mission and the clients you serve..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Profile
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
