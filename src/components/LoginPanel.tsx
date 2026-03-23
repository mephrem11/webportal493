import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Shield,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import logo from "../assets/logo.svg";

export function LoginPanel() {
  const { login, loading } = useSimpleAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"partner" | "staff">("partner");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);

      if (password === "goodsrecycling") {
        navigate("/password-change", { state: { email } });
        return;
      }

      if (activeTab === "staff") {
        navigate("/staff/dashboard");
      } else {
        navigate("/portal");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(message);
    }
  };

  const handleDemoLogin = async (type: "partner" | "staff") => {
    setError("");

    const credentials =
      type === "staff"
        ? { email: "admin@goodsrecycling.org", password: "admin123" }
        : { email: "partner@charity.org", password: "partner123" };

    setEmail(credentials.email);
    setPassword(credentials.password);

    try {
      await login(credentials.email, credentials.password);
      navigate(type === "staff" ? "/staff/dashboard" : "/portal");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(message);
    }
  };

  return (
    <section className="px-6 py-24 md:px-12 lg:px-24 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <img src={logo} alt="Goods Recycling" className="object-contain w-auto h-28 md:h-36" />
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-center gap-12 md:flex-row lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center md:mb-0 md:w-1/2 md:text-left"
          >
            <h2 className="mb-4 text-3xl font-extrabold text-transparent bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text md:text-4xl">
              {activeTab === "partner" ? "Charity Partner Portal" : "Staff Portal"}
            </h2>
            <p className="max-w-lg mx-auto mb-6 text-lg leading-relaxed text-[#555555] md:mx-0">
              {activeTab === "partner"
                ? "Secure access for charity partners to view requests, track deliveries, and browse available inventory."
                : "Administrative access for Goods Recycling staff to manage inventory, process requests, and coordinate operations."}
            </p>

            <div className="p-5 mb-4 border-2 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <h3 className="mb-3 text-sm font-bold tracking-wide uppercase text-emerald-800">
                {activeTab === "partner" ? "Partner Features:" : "Staff Features:"}
              </h3>
              {activeTab === "partner" ? (
                <ul className="space-y-2 text-sm text-[#555555]">
                  <li className="flex items-start gap-2"><span className="font-bold text-emerald-600">✓</span><span>View submitted wish lists and requests</span></li>
                  <li className="flex items-start gap-2"><span className="font-bold text-emerald-600">✓</span><span>Browse available inventory catalog</span></li>
                  <li className="flex items-start gap-2"><span className="font-bold text-emerald-600">✓</span><span>Track delivery status in real-time</span></li>
                  <li className="flex items-start gap-2"><span className="font-bold text-emerald-600">✓</span><span>View weekly delivery schedules</span></li>
                  <li className="flex items-start gap-2"><span className="font-bold text-emerald-600">✓</span><span>View organization profile</span></li>
                </ul>
              ) : (
                <ul className="space-y-2 text-sm text-[#555555]">
                  <li className="flex items-start gap-2"><span className="font-bold text-blue-600">✓</span><span>Full inventory management and editing</span></li>
                  <li className="flex items-start gap-2"><span className="font-bold text-blue-600">✓</span><span>Google Sheets sync integration</span></li>
                  <li className="flex items-start gap-2"><span className="font-bold text-blue-600">✓</span><span>Process and manage all requests</span></li>
                  <li className="flex items-start gap-2"><span className="font-bold text-blue-600">✓</span><span>Application approval workflow</span></li>
                  <li className="flex items-start gap-2"><span className="font-bold text-blue-600">✓</span><span>Complete administrative access</span></li>
                </ul>
              )}
            </div>

            {activeTab === "partner" && (
              <div className="hidden p-6 mt-8 bg-white border-2 rounded-xl shadow-lg md:block border-emerald-200">
                <p className="mb-2 text-sm font-semibold text-[#555555]">Not a partner yet?</p>
                <Link to="/apply" className="inline-flex items-center gap-2 font-bold transition-colors cursor-pointer text-emerald-600 hover:text-emerald-800">
                  Apply for Partnership <span className="text-lg">→</span>
                </Link>
                <div className="pt-3 mt-3 border-t border-emerald-200">
                  <p className="mb-2 text-sm text-[#555555]">Already applied?</p>
                  <Link to="/apply/status" className="inline-flex items-center gap-2 font-bold text-blue-600 transition-colors cursor-pointer hover:text-blue-800">
                    Check Application Status <span className="text-lg">→</span>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden w-full md:w-1/2 lg:w-1/3 bg-gradient-to-br from-white to-emerald-50 border-2 rounded-2xl shadow-2xl border-emerald-200"
          >
            <div className="flex border-b-2 border-emerald-200">
              <button
                onClick={() => setActiveTab("partner")}
                className={`flex-1 py-4 px-6 font-bold text-sm uppercase tracking-wide transition-all ${
                  activeTab === "partner"
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users size={18} />
                  <span>Partner Login</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("staff")}
                className={`flex-1 py-4 px-6 font-bold text-sm uppercase tracking-wide transition-all ${
                  activeTab === "staff"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Shield size={18} />
                  <span>Staff Login</span>
                </div>
              </button>
            </div>

            <div className="p-8 md:p-10">
              <div className="mb-8 text-center">
                <div
                  className={`inline-block p-4 rounded-2xl shadow-lg mb-4 ${
                    activeTab === "partner"
                      ? "bg-gradient-to-br from-emerald-500 to-green-600"
                      : "bg-gradient-to-br from-blue-500 to-indigo-600"
                  }`}
                >
                  <Lock className="text-white" size={32} strokeWidth={2.5} />
                </div>
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    activeTab === "partner"
                      ? "bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent"
                  }`}
                >
                  {activeTab === "partner" ? "Partner Access" : "Staff Access"}
                </h3>
                <p className="text-[#555555] text-sm leading-relaxed">
                  {activeTab === "partner"
                    ? "Sign in to view your charity dashboard."
                    : "Sign in to access staff management tools."}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 mb-6 border-2 border-red-200 rounded-lg bg-red-50">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className={`block text-sm font-bold ${
                      activeTab === "partner" ? "text-emerald-800" : "text-blue-800"
                    }`}
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${
                      activeTab === "partner"
                        ? "border-emerald-200 focus:ring-emerald-500"
                        : "border-blue-200 focus:ring-blue-500"
                    }`}
                    placeholder={
                      activeTab === "partner" ? "partner@charity.org" : "staff@goodsrecycling.org"
                    }
                  />
                </div>

                <div className="relative space-y-2">
                  <label
                    htmlFor="password"
                    className={`block text-sm font-bold ${
                      activeTab === "partner" ? "text-emerald-800" : "text-blue-800"
                    }`}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${
                      activeTab === "partner"
                        ? "border-emerald-200 focus:ring-emerald-500"
                        : "border-blue-200 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 transform text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    activeTab === "partner"
                      ? "bg-gradient-to-r from-emerald-600 to-green-700 hover:from-green-700 hover:to-emerald-800 text-white"
                      : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      <span>Sign In</span>
                    </>
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className={`w-full border-t-2 ${
                        activeTab === "partner" ? "border-emerald-200" : "border-blue-200"
                      }`}
                    ></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span
                      className={`bg-gradient-to-br from-white to-emerald-50 px-4 font-bold ${
                        activeTab === "partner" ? "text-emerald-700" : "text-blue-700"
                      }`}
                    >
                      Or try demo
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDemoLogin(activeTab)}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-cyan-700 hover:to-teal-800 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">Demo</span>
                      <span>{activeTab === "partner" ? "Partner" : "Staff"} Login</span>
                    </>
                  )}
                </button>

                <div
                  className={`border-2 rounded-lg p-4 ${
                    activeTab === "partner" ? "bg-blue-50 border-blue-200" : "bg-indigo-50 border-indigo-200"
                  }`}
                >
                  <h4
                    className={`font-bold mb-2 text-sm ${
                      activeTab === "partner" ? "text-blue-900" : "text-indigo-900"
                    }`}
                  >
                    Secure Login
                  </h4>
                  <ul
                    className={`text-xs space-y-1 ${
                      activeTab === "partner" ? "text-blue-800" : "text-indigo-800"
                    }`}
                  >
                    <li>Your credentials are encrypted</li>
                    <li>Secure database authentication</li>
                    <li>Your data stays private</li>
                  </ul>
                </div>

                {activeTab === "partner" && (
                  <p className="text-xs font-medium text-center text-emerald-700">
                    <Link to="/apply" className="font-semibold hover:text-emerald-900 hover:underline md:hidden">
                      Need an account? Apply here
                    </Link>
                  </p>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
