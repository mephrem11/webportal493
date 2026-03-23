import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getSheetsConfig,
  saveSheetsConfig,
  triggerFullSheetsSync,
  getSheetsSyncWebhook,
  saveSheetsSyncWebhook,
  getSheetsSyncStatus,
  type SheetsSyncStatus,
  type SheetConfig,
} from "../utils/googleSheetsSync";
import {
  Sheet,
  Settings,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

export function SheetsConfig() {
  const navigate = useNavigate();
  const { logout } = useSimpleAuth();
  const [sheets, setSheets] = useState<SheetConfig[]>(getSheetsConfig);
  const [webhookUrl, setWebhookUrl] = useState(getSheetsSyncWebhook);
  const [saving, setSaving] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState<SheetsSyncStatus>(getSheetsSyncStatus);
  const [, setClock] = useState(Date.now());

  useEffect(() => {
    const onStatus = (event: Event) => {
      const custom = event as CustomEvent<SheetsSyncStatus>;
      if (custom.detail) {
        setSyncStatus(custom.detail);
      }
    };

    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    window.addEventListener("googleSheetsSyncStatus", onStatus as EventListener);

    return () => {
      window.removeEventListener("googleSheetsSyncStatus", onStatus as EventListener);
      window.clearInterval(timer);
    };
  }, []);

  const retrySeconds = useMemo(() => {
    if (!syncStatus.nextRetryAt) return 0;
    const retryAt = new Date(syncStatus.nextRetryAt).getTime();
    const diffMs = retryAt - Date.now();
    return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
  }, [syncStatus.nextRetryAt]);

  const updateSheet = (index: number, updates: Partial<SheetConfig>) => {
    setSheets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      saveSheetsConfig(sheets);
      saveSheetsSyncWebhook(webhookUrl);
      await triggerFullSheetsSync("manual");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save configuration. Please verify the webhook URL and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
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

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#00D084] to-[#00C878] px-8 py-6">
            <div className="flex items-center gap-3">
              <Sheet size={28} className="text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Google Sheets Configuration</h1>
                <p className="text-white/90 text-sm">
                  Connect your data to Google Sheets for easy export and reporting
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <CheckCircle size={16} />
                Configuration saved successfully!
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              <p className="font-semibold text-gray-900 mb-1">Sync Status</p>
              {syncStatus.isSyncing ? (
                <p className="text-blue-700">Syncing now...</p>
              ) : syncStatus.lastError ? (
                <p className="text-red-700">Last sync failed</p>
              ) : syncStatus.lastSuccessAt ? (
                <p className="text-green-700">Last sync succeeded</p>
              ) : (
                <p className="text-gray-600">No sync attempt yet.</p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Last success: {syncStatus.lastSuccessAt ? new Date(syncStatus.lastSuccessAt).toLocaleString() : "Never"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Last attempt reason: {syncStatus.lastReason || "-"}
              </p>
            </div>

            {syncStatus.lastError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle size={16} className="mt-0.5" />
                <div>
                  <p className="font-medium">Sync error: {syncStatus.lastError}</p>
                  <p className="text-xs mt-1">
                    Failures: {syncStatus.consecutiveFailures}
                    {retrySeconds > 0 ? ` • retrying in ${retrySeconds}s` : " • waiting for next trigger"}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <Settings size={16} className="mt-0.5 flex-shrink-0" />
                <p>
                  Enter your Google Spreadsheet IDs to sync data automatically. You can find the
                  spreadsheet ID in the URL:{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    docs.google.com/spreadsheets/d/<strong>[ID]</strong>/edit
                  </code>
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Sync Webhook</h3>
              <p className="text-xs text-gray-600">
                Optional: set your Google Apps Script or backend webhook URL for push updates. If blank, the app still auto-pulls from your sheet IDs every 5-15 seconds.
              </p>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/your-script-id/exec"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  setSyncingNow(true);
                  await triggerFullSheetsSync("manual");
                  setSyncingNow(false);
                }}
                disabled={syncingNow}
                className="flex-1 flex items-center justify-center gap-2 border border-[#00C853] text-[#00C853] py-2.5 rounded-lg font-semibold transition-colors hover:bg-green-50 disabled:opacity-60"
              >
                {syncingNow ? (
                  <span className="w-4 h-4 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Settings size={16} />
                    Sync Now
                  </>
                )}
              </button>
            </div>

            {sheets.map((sheet, index) => (
              <div
                key={sheet.name}
                className="border border-gray-200 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{sheet.name}</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-600">Enable sync</span>
                    <div
                      onClick={() => updateSheet(index, { enabled: !sheet.enabled })}
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                        sheet.enabled ? "bg-[#00C853]" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 mx-0.5 ${
                          sheet.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Spreadsheet ID
                    </label>
                    <input
                      type="text"
                      value={sheet.spreadsheetId}
                      onChange={(e) =>
                        updateSheet(index, { spreadsheetId: e.target.value })
                      }
                      placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                      disabled={!sheet.enabled}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sheet / Tab Name
                    </label>
                    <input
                      type="text"
                      value={sheet.sheetName}
                      onChange={(e) =>
                        updateSheet(index, { sheetName: e.target.value })
                      }
                      disabled={!sheet.enabled}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00C853] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>

                {sheet.spreadsheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <ExternalLink size={12} />
                    Open spreadsheet
                  </a>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Settings size={18} />
                  Save Configuration
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
