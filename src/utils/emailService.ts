import emailjs from "@emailjs/browser";
import { queueSimulatedEmail } from "./emailSimulation";

export type PortalEmail = {
  to: string;
  from: string;
  subject: string;
  message: string;
};

export type EmailSendResult = {
  sent: boolean;
  provider: "emailjs" | "custom-endpoint" | "simulation";
  error?: string;
};

const EMAIL_ENDPOINT = (import.meta.env.VITE_EMAIL_ENDPOINT || "").trim();
const EMAIL_ENDPOINT_AUTH = (import.meta.env.VITE_EMAIL_ENDPOINT_AUTH || "").trim();

const EMAILJS_SERVICE_ID = (import.meta.env.VITE_EMAILJS_SERVICE_ID || "").trim();
const EMAILJS_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "").trim();
const EMAILJS_PUBLIC_KEY = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "").trim();

/** Returns true if EmailJS keys are fully configured. */
export function isEmailConfigured(): boolean {
  return Boolean(
    EMAIL_ENDPOINT ||
    (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY)
  );
}

async function sendViaCustomEndpoint(email: PortalEmail): Promise<boolean> {
  if (!EMAIL_ENDPOINT) return false;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (EMAIL_ENDPOINT_AUTH) headers.Authorization = `Bearer ${EMAIL_ENDPOINT_AUTH}`;

  const response = await fetch(EMAIL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(email),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Email endpoint failed with ${response.status}`);
  }
  return true;
}

async function sendViaEmailJS(email: PortalEmail): Promise<boolean> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) return false;

  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_email: email.to,
      from_name: email.from,
      subject: email.subject,
      message: email.message,
    },
    EMAILJS_PUBLIC_KEY,
  );
  return true;
}

export async function sendPortalEmail(email: PortalEmail): Promise<EmailSendResult> {
  try {
    const endpointSent = await sendViaCustomEndpoint(email);
    if (endpointSent) return { sent: true, provider: "custom-endpoint" };

    const emailJsSent = await sendViaEmailJS(email);
    if (emailJsSent) return { sent: true, provider: "emailjs" };

    queueSimulatedEmail(email);
    return {
      sent: false,
      provider: "simulation",
      error: "No real email provider configured. Set VITE_EMAIL_ENDPOINT or EmailJS environment keys.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email delivery error";
    queueSimulatedEmail(email);
    return { sent: false, provider: "simulation", error: message };
  }
}
