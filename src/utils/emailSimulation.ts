type SimulatedEmail = {
  id: string;
  to: string;
  from: string;
  subject: string;
  message: string;
  createdAt: string;
};

const EMAIL_STORE_KEY = "simulated_emails";

function readStoredEmails(): SimulatedEmail[] {
  try {
    return JSON.parse(localStorage.getItem(EMAIL_STORE_KEY) || "[]") as SimulatedEmail[];
  } catch {
    return [];
  }
}

export function queueSimulatedEmail(input: Omit<SimulatedEmail, "id" | "createdAt">): SimulatedEmail {
  const entry: SimulatedEmail = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  const existing = readStoredEmails();
  existing.unshift(entry);
  localStorage.setItem(EMAIL_STORE_KEY, JSON.stringify(existing));
  return entry;
}

export function buildPartnerConfirmEmail(name: string): { from: string; subject: string; message: string } {
  return {
    from: "noreply@goodsrecycling.org",
    subject: "Your Goods Recycling partner account was created",
    message:
      `Hi ${name || "Partner"},\n\nThank you for creating your Goods Recycling partner account. Your account is now pending staff review. We will notify you once your account is approved.\n\nThank you,\nGoods Recycling Team`,
  };
}

export function buildPartnerApplicationConfirmEmail(name: string): {
  from: string;
  subject: string;
  message: string;
} {
  return {
    from: "noreply@goodsrecycling.org",
    subject: "Thank you for your Goods Recycling application",
    message:
      `Hi ${name || "Partner"},\n\nThank you for your application to become a Goods Recycling partner. Our team has received your submission and will review it within 5 business days.\n\nThank you,\nGoods Recycling Team`,
  };
}

export function buildStaffNotifyEmail(partnerEmail: string, organization: string): {
  from: string;
  subject: string;
  message: string;
} {
  return {
    from: "noreply@goodsrecycling.org",
    subject: "New partner account submission pending staff review",
    message:
      `A new partner account was submitted by ${partnerEmail} (${organization}). Please review and confirm this account right away.`,
  };
}
