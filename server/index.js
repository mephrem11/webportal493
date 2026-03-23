import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Universal SMTP — works with any provider: Gmail, Outlook, Yahoo, iCloud, custom
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "noreply@goodsrecycling.org";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || "";

let transporter = null;
let usingRealSMTP = false;

async function createTransporter() {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });

    try {
      await transporter.verify();
      usingRealSMTP = true;
      console.log("\n📧  Email server ready  — real delivery enabled");
      console.log(`    SMTP host : ${SMTP_HOST}:${SMTP_PORT}`);
      console.log(`    Sending from: ${SMTP_FROM}\n`);
    } catch (err) {
      console.error("\n❌  SMTP connection failed:", err.message);
      console.log("    Check your SMTP_HOST / SMTP_USER / SMTP_PASS in .env\n");
      await fallbackToEthereal();
    }
  } else {
    await fallbackToEthereal();
  }
}

async function fallbackToEthereal() {
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  usingRealSMTP = false;
  console.log("\n⚠️   Email server in TEST MODE (Ethereal — NOT delivered to real inboxes)");
  console.log("    Add SMTP_HOST + SMTP_USER + SMTP_PASS to .env to enable real delivery.");
  console.log("    View test emails at: https://ethereal.email/messages");
  console.log(`    Login  →  ${testAccount.user}  /  ${testAccount.pass}\n`);
}

app.post("/send-email", async (req, res) => {
  const { to, from, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields: to, subject, message" });
  }

  if (!transporter) {
    return res.status(503).json({ error: "Email server not ready yet, try again." });
  }

  try {
    const info = await transporter.sendMail({
      from: `"Goods Recycling" <${SMTP_FROM}>`,
      to,
      subject,
      text: message,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff">
        <div style="background:linear-gradient(135deg,#C6F6D5,#A7F3D0);padding:24px 24px 16px;border-radius:12px 12px 0 0;text-align:center">
          <h2 style="margin:0;color:#1a1a1a;font-size:20px">Goods Recycling</h2>
        </div>
        <div style="padding:24px;background:#fafafa;border-radius:0 0 12px 12px">
          ${message.split("\n").map((line) => `<p style="margin:6px 0;color:#333">${line || "&nbsp;"}</p>`).join("")}
        </div>
        <p style="font-size:11px;color:#aaa;margin-top:16px;text-align:center">Goods Recycling · Automated notification · Do not reply</p>
      </div>`,
    });

    if (usingRealSMTP) {
      console.log(`✉️   Delivered to ${to}`);
      res.json({ success: true, messageId: info.messageId });
    } else {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`✉️   Test email for ${to}`);
      console.log(`     Preview: ${previewUrl}\n`);
      res.json({ success: true, messageId: info.messageId, previewUrl });
    }
  } catch (err) {
    console.error("Email send error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/send-sms", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "Missing required fields: to, message" });
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return res.status(503).json({ error: "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER." });
  }

  try {
    const body = new URLSearchParams({
      To: String(to),
      From: TWILIO_FROM_NUMBER,
      Body: String(message),
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || `Twilio failed with ${response.status}`);
    }

    console.log(`📱  SMS delivered to ${to}`);
    res.json({ success: true, sid: payload.sid });
  } catch (err) {
    console.error("SMS send error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

createTransporter().then(() => {
  app.listen(3001, () =>
    console.log("📬  Email server listening on http://localhost:3001\n")
  );
});
