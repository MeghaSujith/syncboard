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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const getAssignmentEmailHtml = (cardTitle, cardDescription, priorityEmoji, dueDateText, boardName, assignedByName) => `
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
          ${priorityEmoji} Priority
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
    <p style="text-align: center; color: #94a3b8; font-size: 13px; margin: 0;">Log in to SyncBoard to view and update your task.</p>
  </div>
`;

// ---------------------------------------------------------------------------
// /api/digest
//
// Previously: exec() ran synchronously in the request callback, so the
// frontend button sat "stuck" for the full duration of the Python script
// (interpreter startup + firebase_admin import + DB read + every email
// send) before getting any response at all.
//
// Now: the request responds immediately (202 Accepted) once the script
// has been *launched*, and the digest continues running in the
// background. The frontend should treat this as "queued", not "done" —
// see the matching frontend note below the route.
//
// A hard timeout is also added so a hung Python process (e.g. a stuck
// Firebase auth call) can't silently run forever without anyone noticing.
// ---------------------------------------------------------------------------
app.post("/api/digest", (req, res) => {
  const { boardId, boardName } = req.body;
  if (!boardId) return res.status(400).json({ error: "Board ID is required" });

  const scriptPath = path.join(__dirname, "digest.py");
  const command = `python "${scriptPath}" --board ${boardId}`;

  // Respond immediately — don't make the user's click wait on the
  // Python process (interpreter startup + Firebase + email sends).
  res.status(202).json({ message: `Digest for ${boardName} has been queued.` });

  const startedAt = Date.now();
  exec(
    command,
    { timeout: 60_000, maxBuffer: 1024 * 1024 * 5 }, // 60s safety timeout, 5MB output buffer
    (error, stdout, stderr) => {
      const elapsedMs = Date.now() - startedAt;
      if (error) {
        console.error(`[digest] board=${boardId} failed after ${elapsedMs}ms:`, stderr || error.message);
        return;
      }
      console.log(`[digest] board=${boardId} completed in ${elapsedMs}ms`);
      if (stdout) console.log(stdout);
    }
  );
});

app.post("/api/assign", async (req, res) => {
  const { assigneeEmail, cardTitle, cardDescription, dueDate, priority, boardName, assignedBy } = req.body;

  if (!assigneeEmail || !cardTitle) {
    return res.status(400).json({ error: "assigneeEmail and cardTitle are required" });
  }

  const priorityEmoji = { low: "🟢", medium: "🟡", high: "🔴", critical: "🔥" }[priority] || "🟡";
  const dueDateText = dueDate ? `📅 Due: ${dueDate}` : "No due date set";
  const assignedByName = assignedBy ? assignedBy.split("@")[0] : "A team member";
  const htmlBody = getAssignmentEmailHtml(cardTitle, cardDescription, priorityEmoji, dueDateText, boardName, assignedByName);

  try {
    await transporter.sendMail({
      from: `"SyncBoard" <${process.env.GMAIL_USER}>`,
      to: assigneeEmail,
      subject: `📋 You've been assigned: ${cardTitle}`,
      html: htmlBody,
    });
    res.json({ message: "Assignment email sent!" });
  } catch (err) {
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
app.listen(PORT);