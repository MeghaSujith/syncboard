const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { exec } = require("child_process");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["POST", "GET"],
  credentials: true,
}));

app.use(express.json());

// ── Email transporter (uses same creds as digest) ──────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});
// ── Existing digest endpoint ───────────────────────────────────────────────
app.post("/api/digest", (req, res) => {
  const { boardId, boardName } = req.body;
  if (!boardId) return res.status(400).json({ error: "Board ID is required" });

  const scriptPath = path.join(__dirname, "digest.py");
  const command = `python "${scriptPath}" --board ${boardId}`;
  console.log(`Executing: ${command}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Python Execution Error:", error);
      console.error("Stderr Details:", stderr);
      return res.status(500).json({ error: stderr || "Failed to run digest" });
    }
    console.log("Python Output:", stdout);
    res.json({ message: `Digest for ${boardName} processed!`, output: stdout });
  });
});

// ── New assignment email endpoint ──────────────────────────────────────────
app.post("/api/assign", async (req, res) => {
  const { assigneeEmail, assigneeName, cardTitle, cardDescription, dueDate, priority, boardName, assignedBy } = req.body;

  if (!assigneeEmail || !cardTitle) {
    return res.status(400).json({ error: "assigneeEmail and cardTitle are required" });
  }

  const priorityEmoji = { low: "🟢", medium: "🟡", high: "🔴", critical: "🔥" }[priority] || "🟡";
  const dueDateText = dueDate ? `📅 Due: ${dueDate}` : "No due date set";
  const assignedByName = assignedBy ? assignedBy.split("@")[0] : "A team member";

  const htmlBody = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
      <div style="background: linear-gradient(135deg, #0d9488, #0ea5e9); border-radius: 12px; padding: 28px; margin-bottom: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">📋 SyncBoard</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">You've been assigned a new task</p>
      </div>

      <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
        <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">${cardTitle}</h2>
        ${cardDescription ? `<p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">${cardDescription}</p>` : ""}
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="padding: 10px 14px; background: #f8fafc; border-radius: 8px; font-size: 14px; color: #475569;">
            ${priorityEmoji} Priority: <strong>${priority?.charAt(0).toUpperCase() + priority?.slice(1)}</strong>
          </div>
          <div style="padding: 10px 14px; background: #f8fafc; border-radius: 8px; font-size: 14px; color: #475569;">
            ${dueDateText}
          </div>
          <div style="padding: 10px 14px; background: #f8fafc; border-radius: 8px; font-size: 14px; color: #475569;">
            📁 Board: <strong>${boardName}</strong>
          </div>
          <div style="padding: 10px 14px; background: #f8fafc; border-radius: 8px; font-size: 14px; color: #475569;">
            👤 Assigned by: <strong>${assignedByName}</strong>
          </div>
        </div>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 13px; margin: 0;">
        Log in to SyncBoard to view and update your task.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"SyncBoard" <${process.env.GMAIL_USER}>`,
      to: assigneeEmail,
      subject: `📋 You've been assigned: ${cardTitle}`,
      html: htmlBody,
    });
    console.log(`✅ Assignment email sent to ${assigneeEmail}`);
    res.json({ message: "Assignment email sent!" });
  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/test", (req, res) => {
  res.json({ 
    emailUser: process.env.EMAIL_USER ? "✅ set" : "❌ missing",
    emailPass: process.env.EMAIL_PASS ? "✅ set" : "❌ missing"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});