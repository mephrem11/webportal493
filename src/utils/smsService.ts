export type PortalSms = {
  to: string;
  message: string;
};

export type SmsSendResult = {
  sent: boolean;
  provider: "custom-endpoint" | "simulation";
  error?: string;
};

const SMS_ENDPOINT = (import.meta.env.VITE_SMS_ENDPOINT || "").trim();
const SMS_ENDPOINT_AUTH = (import.meta.env.VITE_SMS_ENDPOINT_AUTH || "").trim();
const SMS_STORE_KEY = "simulated_sms";

function queueSimulatedSms(sms: PortalSms): void {
  try {
    const existing = JSON.parse(localStorage.getItem(SMS_STORE_KEY) || "[]") as Array<PortalSms & { id: string; createdAt: string }>;
    existing.unshift({
      ...sms,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(SMS_STORE_KEY, JSON.stringify(existing));
  } catch {
    // ignore storage failures in simulation mode
  }
}

export function buildPartnerApprovedSms(name: string): string {
  return `Hi ${name || "Partner"}, your Goods Recycling partner account has been approved. You can now sign in.`;
}

export async function sendPortalSms(sms: PortalSms): Promise<SmsSendResult> {
  if (!SMS_ENDPOINT) {
    queueSimulatedSms(sms);
    return {
      sent: false,
      provider: "simulation",
      error: "No SMS endpoint configured. Set VITE_SMS_ENDPOINT to enable real SMS delivery.",
    };
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (SMS_ENDPOINT_AUTH) headers.Authorization = `Bearer ${SMS_ENDPOINT_AUTH}`;

    const response = await fetch(SMS_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(sms),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `SMS endpoint failed with ${response.status}`);
    }

    return { sent: true, provider: "custom-endpoint" };
  } catch (error) {
    queueSimulatedSms(sms);
    return {
      sent: false,
      provider: "simulation",
      error: error instanceof Error ? error.message : "Unknown SMS error",
    };
  }
}