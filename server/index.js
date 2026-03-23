import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let transporter = null;
let testAccount = null;

async function createTransporter() {
  // Creates a free Ethereal Email test account automatically — no sign-up required.
  // Every email sent will have a preview link logged to the console.
  testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("\n📧  Email server ready  (Ethereal test mode)");
  console.log("    View sent emails at: https://ethereal.email/messages");
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
      from: from || "noreply@goodsrecycling.org",
      to,
      subject,
      text: message,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        ${message.split("\n").map((line) => `<p style="margin:4px 0">${line}</p>`).join("")}
        <hr style="margin-top:32px;border:none;border-top:1px solid #eee"/>
        <p style="font-size:12px;color:#999;margin-top:16px">Goods Recycling · Automated notification</p>
      </div>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`✉️   Sent to ${to}`);
    console.log(`     Preview: ${previewUrl}\n`);

    res.json({ success: true, messageId: info.messageId, previewUrl });
  } catch (err) {
    console.error("Email send error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

createTransporter().then(() => {
  app.listen(3001, () =>
    console.log("📬  Email server listening on http://localhost:3001\n")
  );
});
