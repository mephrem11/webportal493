export type SheetConfig = {
  name: string;
  spreadsheetId: string;
  sheetName: string;
  enabled: boolean;
};

export type SheetsSyncStatus = {
  isSyncing: boolean;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  nextRetryAt: string | null;
  lastReason: string | null;
};

type SyncPayload = {
  source: string;
  reason: string;
  syncedAt: string;
  sheets: Array<{
    name: string;
    spreadsheetId: string;
    sheetName: string;
    rowCount: number;
    rows: Record<string, unknown>[];
  }>;
};

const CONFIG_STORAGE_KEY = "google_sheets_config";
const WEBHOOK_STORAGE_KEY = "google_sheets_sync_webhook";
const HASH_STORAGE_KEY = "google_sheets_last_hash";
const STATUS_STORAGE_KEY = "google_sheets_sync_status";
const STATUS_EVENT_NAME = "googleSheetsSyncStatus";
const AUTO_SYNC_MIN_INTERVAL_MS = 5000;
const AUTO_SYNC_MAX_INTERVAL_MS = 15000;
const RETRY_BASE_DELAY_MS = 5000;
const RETRY_MAX_DELAY_MS = 60000;
const PULL_SYNC_HASH_KEY = "google_sheets_pull_hash";

const DEFAULT_SHEETS: SheetConfig[] = [
  {
    name: "Partner Requests",
    spreadsheetId: "1byac3uMHRe_G2BDr4oNcWWI1qGxJ60iT5WcCgX9SJyo",
    sheetName: "Requests",
    enabled: true,
  },
  {
    name: "Delivery Schedule",
    spreadsheetId: "1NqoVRKgbAizlsDxUtEm4xGfSFuumGKgt7ifrv26QA_s",
    sheetName: "Delivery Schedule",
    enabled: true,
  },
  {
    name: "Integrity Log",
    spreadsheetId: "1z2ydRDzgjUCZHqhfz-YSabrZoaSpW7xGTrc23I5CQbU",
    sheetName: "Integrity",
    enabled: true,
  },
];

let syncTimer: number | null = null;
let syncing = false;
let retryTimer: number | null = null;
let nextRetryEpoch = 0;

let syncStatus: SheetsSyncStatus = {
  isSyncing: false,
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastError: null,
  consecutiveFailures: 0,
  nextRetryAt: null,
  lastReason: null,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeConfig(config: SheetConfig[]): SheetConfig[] {
  const byName = new Map(config.map((entry) => [entry.name, entry]));
  return DEFAULT_SHEETS.map((entry) => {
    const saved = byName.get(entry.name);
    if (!saved) return entry;

    let normalizedSheetName = (saved.sheetName || entry.sheetName).trim();
    // Keep Delivery Schedule authoritative even for legacy saved configs.
    if (
      entry.name === "Delivery Schedule" &&
      (!normalizedSheetName || normalizedSheetName.toLowerCase() === "deliveries")
    ) {
      normalizedSheetName = "Delivery Schedule";
    }

    return {
      ...entry,
      ...saved,
      spreadsheetId: (saved.spreadsheetId || entry.spreadsheetId).trim(),
      sheetName: normalizedSheetName,
    };
  });
}

export function getDefaultSheetsConfig(): SheetConfig[] {
  return DEFAULT_SHEETS;
}

export function getSheetsSyncStatus(): SheetsSyncStatus {
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    if (!raw) return syncStatus;
    const parsed = JSON.parse(raw) as SheetsSyncStatus;
    syncStatus = { ...syncStatus, ...parsed };
    return syncStatus;
  } catch {
    return syncStatus;
  }
}

function publishSyncStatus() {
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(syncStatus));
  window.dispatchEvent(new CustomEvent(STATUS_EVENT_NAME, { detail: syncStatus }));
}

function updateSyncStatus(patch: Partial<SheetsSyncStatus>) {
  syncStatus = { ...syncStatus, ...patch };
  publishSyncStatus();
}

function clearRetryTimer() {
  if (retryTimer !== null) {
    window.clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function scheduleRetry() {
  clearRetryTimer();

  const delay = Math.min(
    RETRY_BASE_DELAY_MS * 2 ** Math.max(0, syncStatus.consecutiveFailures - 1),
    RETRY_MAX_DELAY_MS,
  );

  nextRetryEpoch = Date.now() + delay;
  updateSyncStatus({ nextRetryAt: new Date(nextRetryEpoch).toISOString() });

  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    void triggerFullSheetsSync("retry");
  }, delay);
}

export function getSheetsConfig(): SheetConfig[] {
  return normalizeConfig(readJson<SheetConfig[]>(CONFIG_STORAGE_KEY, DEFAULT_SHEETS));
}

export function saveSheetsConfig(config: SheetConfig[]) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
}

export function getSheetsSyncWebhook(): string {
  const saved = localStorage.getItem(WEBHOOK_STORAGE_KEY) || "";
  return (saved || import.meta.env.VITE_GOOGLE_SHEETS_SYNC_URL || "").trim();
}

export function saveSheetsSyncWebhook(url: string) {
  localStorage.setItem(WEBHOOK_STORAGE_KEY, url.trim());
}

function toIso(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function buildPartnerRequestRows(): Record<string, unknown>[] {
  const simpleRequests = readJson<Array<Record<string, unknown>>>("simple_requests", []);
  const legacyRequests = readJson<Array<Record<string, unknown>>>("partner_requests", []);
  const merged = [...simpleRequests, ...legacyRequests];
  const seen = new Set<string>();

  return merged
    .map((row) => ({
      id: String(row.id ?? ""),
      partner_email: String(row.partner_email ?? row.email ?? ""),
      item_type: String(row.item_type ?? row.title ?? ""),
      quantity: Number(row.quantity ?? 0),
      status: String(row.status ?? "pending"),
      pickup_address: String(row.pickup_address ?? row.deliveryAddress ?? ""),
      notes: String(row.notes ?? row.description ?? ""),
      created_at: toIso(String(row.created_at ?? row.createdAt ?? "")),
      updated_at: toIso(String(row.updated_at ?? row.updatedAt ?? "")),
    }))
    .filter((row) => {
      if (!row.id) return false;
      const id = String(row.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function buildDeliveryRows(): Record<string, unknown>[] {
  const scheduled = readJson<Array<Record<string, unknown>>>("scheduled_deliveries", []);
  const partnerDeliveries = readJson<Array<Record<string, unknown>>>("partner_deliveries", []);
  const merged = [...scheduled, ...partnerDeliveries];
  const seen = new Set<string>();

  return merged
    .map((row) => ({
      id: String(row.id ?? ""),
      day: String(row.day ?? ""),
      scheduled_date: String(row.scheduledDate ?? ""),
      start_time: String(row.startTime ?? ""),
      end_time: String(row.endTime ?? ""),
      address: String(row.address ?? ""),
      contact_name: String(row.contactName ?? ""),
      contact_phone: String(row.contactPhone ?? ""),
      notes: String(row.notes ?? ""),
      status: String(row.status ?? "awaiting-pickup"),
      created_at: toIso(String(row.createdAt ?? "")),
    }))
    .filter((row) => {
      if (!row.id) return false;
      const id = String(row.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function buildIntegrityRows(): Record<string, unknown>[] {
  const staffInventory = readJson<Array<Record<string, unknown>>>("staff_inventory", []);
  const partnerInventory = readJson<Array<Record<string, unknown>>>("inventory_items", []);
  const merged = staffInventory.length > 0 ? staffInventory : partnerInventory;

  return merged.map((row, index) => ({
    id: String(row.id ?? `inventory-${index + 1}`),
    name: String(row.name ?? row.category ?? ""),
    category: String(row.category ?? ""),
    size: String(row.size ?? ""),
    quantity: Number(row.quantity ?? 0),
    condition: String(row.condition ?? ""),
    notes: String(row.notes ?? row.location ?? ""),
    last_updated: toIso(String(row.lastUpdated ?? row.last_updated ?? "")),
  }));
}

function buildPayload(reason: string): SyncPayload {
  const sheets = getSheetsConfig();
  const rowsByName: Record<string, Record<string, unknown>[]> = {
    "Partner Requests": buildPartnerRequestRows(),
    "Delivery Schedule": buildDeliveryRows(),
    "Integrity Log": buildIntegrityRows(),
  };

  return {
    source: "goods-recycling-portal",
    reason,
    syncedAt: new Date().toISOString(),
    sheets: sheets
      .filter((sheet) => sheet.enabled && sheet.spreadsheetId)
      .map((sheet) => {
        const rows = rowsByName[sheet.name] || [];
        return {
          name: sheet.name,
          spreadsheetId: sheet.spreadsheetId,
          sheetName: sheet.sheetName,
          rowCount: rows.length,
          rows,
        };
      }),
  };
}

function sanitizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function firstText(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function firstTextByKeyParts(row: Record<string, unknown>, requiredParts: string[]): string {
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null) continue;
    const normalizedKey = sanitizeKey(key);
    const matches = requiredParts.every((part) => normalizedKey.includes(part));
    if (!matches) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function parseItemsField(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(/\||,|;|\n|\//g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseGvizDateLiteral(value: string): string {
  const match = value.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})(?:,(\d{1,2}),(\d{1,2}),(\d{1,2}))?\)$/);
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const second = Number(match[6] || 0);
  const parsed = new Date(Date.UTC(year, month, day, hour, minute, second));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function normalizeDateValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
  }

  const text = String(value).trim();
  if (!text) return "";
  if (text.startsWith("Date(")) return parseGvizDateLiteral(text);

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
}

function parseNumber(value: unknown, fallback = 0): number {
  const num = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(num) ? num : fallback;
}

function parseGvizResponse(text: string): Record<string, unknown>[] {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0 || jsonEnd <= jsonStart) return [];

  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
    table?: {
      cols?: Array<{ label?: string }>;
      rows?: Array<{ c?: Array<{ v?: unknown; f?: string }> }>;
    };
  };

  const cols = parsed.table?.cols || [];
  const rows = parsed.table?.rows || [];
  const headers = cols.map((col, index) => sanitizeKey(col.label || `col_${index + 1}`));

  return rows.map((row) => {
    const values = row.c || [];
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const cell = values[index];
      const rawValue = cell?.v;
      if (typeof rawValue === "string" && rawValue.startsWith("Date(") && cell?.f) {
        record[header] = cell.f;
        return;
      }
      record[header] = rawValue ?? cell?.f ?? "";
    });
    return record;
  });
}

async function fetchSheetRows(spreadsheetId: string, sheetName: string): Promise<Record<string, unknown>[]> {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sheet pull failed (${sheetName}): ${response.status}`);
  }

  const text = await response.text();
  return parseGvizResponse(text);
}

function getSheetNameCandidates(sheet: SheetConfig): string[] {
  const configured = sheet.sheetName.trim();
  const candidates = [configured];

  if (sheet.name === "Delivery Schedule") {
    // Prefer the actual schedule tab first, but keep legacy fallback.
    candidates.unshift("Delivery Schedule");
    candidates.push("Deliveries");
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

async function fetchSheetRowsWithFallback(sheet: SheetConfig): Promise<Record<string, unknown>[]> {
  const candidates = getSheetNameCandidates(sheet);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      return await fetchSheetRows(sheet.spreadsheetId, candidate);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error(`Sheet pull failed (${sheet.sheetName})`);
}

function writePartnerRequestsFromSheet(rows: Record<string, unknown>[]) {
  const requests = rows
    .map((row, index) => {
      const id = String(row.id ?? row.request_id ?? `req-${index + 1}`).trim();
      return {
        id,
        item_type: String(row.item_type ?? row.title ?? "").trim(),
        quantity: parseNumber(row.quantity, 0),
        pickup_address: String(row.pickup_address ?? row.delivery_address ?? "").trim(),
        notes: String(row.notes ?? row.description ?? "").trim(),
        status: String(row.status ?? "pending").trim() || "pending",
        partner_email: String(row.partner_email ?? row.email ?? "").trim(),
        created_at: toIso(String(row.created_at ?? row.createdat ?? "")) || new Date().toISOString(),
      };
    })
    .filter((row) => row.id);

  localStorage.setItem("simple_requests", JSON.stringify(requests));

  const legacy = requests.map((row) => ({
    id: row.id,
    title: row.item_type,
    quantity: row.quantity,
    status: row.status,
    email: row.partner_email,
    description: row.notes,
    createdAt: row.created_at,
    deliveryAddress: row.pickup_address,
  }));
  localStorage.setItem("partner_requests", JSON.stringify(legacy));
}

function writeDeliveriesFromSheet(rows: Record<string, unknown>[]) {
  const normalizeStatus = (status: string): "awaiting-pickup" | "in-progress" | "full" | "half-full" | "cancelled" => {
    const normalized = status.trim().toLowerCase();
    if (!normalized) return "awaiting-pickup";
    if (normalized === "in transit" || normalized === "in-transit" || normalized === "in progress" || normalized === "in-progress") {
      return "in-progress";
    }
    if (normalized === "full" || normalized === "delivered" || normalized === "complete" || normalized === "completed") {
      return "full";
    }
    if (normalized === "half full" || normalized === "half-full" || normalized === "halffull" || normalized === "hakfl full") {
      return "half-full";
    }
    if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
    if (normalized === "scheduled" || normalized === "awaiting pickup" || normalized === "awaiting-pickup") {
      return "awaiting-pickup";
    }
    return "awaiting-pickup";
  };

  const deliveries = rows
    .map((row, index) => {
      const id = firstText(row, ["id", "delivery_id", "deliveryid", "c", "bin", "bin_id", "bin_number"]);
      const address = firstText(row, ["address", "bin_address", "binaddress", "pickup_address", "delivery_address"]);
      const scheduledDate = normalizeDateValue(
        firstText(row, ["scheduled_date", "scheduleddate", "delivery_date", "delivery_dates", "deliverydate", "date"]),
      );
      const drivers = firstText(row, ["drivers", "driver", "driver_name", "drivername", "contact_name", "contactname"]);
      const milestone = firstText(row, ["milestone", "stage", "step"]);
      const itemsPickedText = firstText(row, [
        "items",
        "items_picked",
        "item_picked",
        "picked_items",
        "pick_items",
        "picked_item",
        "items_picks",
        "item_picks",
        "items_pick",
        "item_pick",
        "items_picked_at_each_address",
        "item_picked_at_each_address",
      ]) || firstTextByKeyParts(row, ["item", "pick", "address"]) || firstTextByKeyParts(row, ["item", "pick"]);
      const items = parseItemsField(itemsPickedText);
      const rawStatus = firstText(row, ["status"]);
      const hasOperationalDetails = Boolean(address || scheduledDate || drivers || milestone || rawStatus || items.length > 0);

      return {
        id: id || (hasOperationalDetails ? `del-${index + 1}` : ""),
        day: String(row.day ?? "").trim(),
        startTime: String(row.start_time ?? row.starttime ?? "").trim(),
        endTime: String(row.end_time ?? row.endtime ?? "").trim(),
        scheduledDate,
        address,
        binAddress: address,
        drivers,
        milestone,
        contactName: firstText(row, ["contact_name", "contactname", "drivers", "driver", "driver_name"]),
        contactPhone: String(row.contact_phone ?? row.contactphone ?? "").trim(),
        notes: String(row.notes ?? "").trim(),
        status: normalizeStatus(rawStatus),
        items,
        createdAt: toIso(String(row.created_at ?? row.createdat ?? "")) || new Date().toISOString(),
        hasOperationalDetails,
      };
    })
    .filter((row) => row.id && row.hasOperationalDetails)
    .map(({ hasOperationalDetails, ...delivery }) => delivery);

  localStorage.setItem("scheduled_deliveries", JSON.stringify(deliveries));
  localStorage.setItem("partner_deliveries", JSON.stringify(deliveries));
}

function writeIntegrityInventoryFromSheet(rows: Record<string, unknown>[]) {
  const staffInventory = rows
    .map((row, index) => {
      const id = String(row.id ?? row.inventory_id ?? `inv-${index + 1}`).trim();
      return {
        id,
        name: String(row.name ?? row.category ?? "").trim(),
        category: String(row.category ?? "").trim(),
        size: String(row.size ?? "").trim() || "One Size",
        quantity: parseNumber(row.quantity, 0),
        condition: String(row.condition ?? "good").trim() || "good",
        notes: String(row.notes ?? row.location ?? "").trim(),
        lastUpdated: toIso(String(row.last_updated ?? row.lastupdated ?? "")) || new Date().toISOString(),
      };
    })
    .filter((row) => row.id);

  localStorage.setItem("staff_inventory", JSON.stringify(staffInventory));

  const partnerInventory = staffInventory.map((row) => ({
    id: row.id,
    category: row.category,
    size: row.size,
    color: "",
    condition: row.condition,
    quantity: row.quantity,
    location: row.notes,
    lastUpdated: row.lastUpdated,
  }));
  localStorage.setItem("inventory_items", JSON.stringify(partnerInventory));
}

export async function pullFromGoogleSheets(reason: string): Promise<boolean> {
  const sheets = getSheetsConfig().filter((sheet) => sheet.enabled && sheet.spreadsheetId);
  if (sheets.length === 0) return false;

  const pulledRows = await Promise.all(
    sheets.map(async (sheet) => ({
      name: sheet.name,
      rows: await fetchSheetRowsWithFallback(sheet),
    })),
  );

  const pullHash = getHash(JSON.stringify(pulledRows));
  const lastPullHash = localStorage.getItem(PULL_SYNC_HASH_KEY);
  if (pullHash === lastPullHash && reason !== "manual") {
    return false;
  }

  for (const result of pulledRows) {
    if (result.name === "Partner Requests") {
      writePartnerRequestsFromSheet(result.rows);
    }
    if (result.name === "Delivery Schedule") {
      writeDeliveriesFromSheet(result.rows);
    }
    if (result.name === "Integrity Log") {
      writeIntegrityInventoryFromSheet(result.rows);
    }
  }

  localStorage.setItem(PULL_SYNC_HASH_KEY, pullHash);
  window.dispatchEvent(new Event("inventoryUpdated"));
  updateSyncStatus({
    lastSuccessAt: new Date().toISOString(),
    lastError: null,
    consecutiveFailures: 0,
    nextRetryAt: null,
    lastReason: `${reason}_pull`,
  });

  return true;
}

export async function triggerFullSheetsSync(reason: string): Promise<void> {
  try {
    await pullFromGoogleSheets(reason);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sheet pull failed";
    updateSyncStatus({
      lastError: message,
      consecutiveFailures: syncStatus.consecutiveFailures + 1,
      lastReason: `${reason}_pull`,
    });
    scheduleRetry();
  }

  await triggerGoogleSheetsSync(reason);
}

function getHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export async function triggerGoogleSheetsSync(reason: string): Promise<boolean> {
  const webhookUrl = getSheetsSyncWebhook();
  if (!webhookUrl) {
    updateSyncStatus({
      isSyncing: false,
      lastError: null,
      lastReason: reason,
    });
    return false;
  }
  if (syncing) return false;

  if (nextRetryEpoch > Date.now() && reason !== "manual") {
    return false;
  }

  updateSyncStatus({
    isSyncing: true,
    lastAttemptAt: new Date().toISOString(),
    lastReason: reason,
  });

  const payload = buildPayload(reason);
  if (payload.sheets.length === 0) {
    updateSyncStatus({
      isSyncing: false,
      lastError: "No enabled sheets are configured to sync.",
    });
    return false;
  }

  const payloadStr = JSON.stringify(payload);
  const payloadHash = getHash(JSON.stringify({ ...payload, syncedAt: "" }));
  const lastHash = localStorage.getItem(HASH_STORAGE_KEY);

  if (lastHash === payloadHash && reason !== "manual") {
    updateSyncStatus({ isSyncing: false });
    return false;
  }

  syncing = true;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payloadStr,
    });

    if (!response.ok) {
      throw new Error(`Sheets sync failed: ${response.status}`);
    }

    localStorage.setItem(HASH_STORAGE_KEY, payloadHash);
    nextRetryEpoch = 0;
    clearRetryTimer();
    updateSyncStatus({
      lastSuccessAt: new Date().toISOString(),
      lastError: null,
      consecutiveFailures: 0,
      nextRetryAt: null,
    });
    return true;
  } catch (error) {
    console.error("Google Sheets sync error", error);
    const message = error instanceof Error ? error.message : "Unknown sync error";
    updateSyncStatus({
      lastError: message,
      consecutiveFailures: syncStatus.consecutiveFailures + 1,
    });
    scheduleRetry();
    return false;
  } finally {
    syncing = false;
    updateSyncStatus({ isSyncing: false });
  }
}

export function startGoogleSheetsAutoSync() {
  if (syncTimer !== null) return;

  const syncNow = () => {
    void triggerFullSheetsSync("auto");
  };

  const scheduleNext = () => {
    const nextDelay =
      AUTO_SYNC_MIN_INTERVAL_MS +
      Math.floor(Math.random() * (AUTO_SYNC_MAX_INTERVAL_MS - AUTO_SYNC_MIN_INTERVAL_MS + 1));
    syncTimer = window.setTimeout(() => {
      syncNow();
      scheduleNext();
    }, nextDelay);
  };

  scheduleNext();

  window.addEventListener("focus", syncNow);
  window.addEventListener("storage", (event) => {
    if (
      event.key === "simple_requests" ||
      event.key === "partner_requests" ||
      event.key === "scheduled_deliveries" ||
      event.key === "partner_deliveries" ||
      event.key === "staff_inventory" ||
      event.key === "inventory_items" ||
      event.key === CONFIG_STORAGE_KEY ||
      event.key === WEBHOOK_STORAGE_KEY
    ) {
      void syncNow();
    }
  });

  // Kick off once on startup.
  void syncNow();
}
