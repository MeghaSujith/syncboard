const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { exec } = require('child_process');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "SyncBoard backend is running!" });
});

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

app.post("/api/digest", (req, res) => {
  const boardId = req.body.boardId || null;
  const scriptPath = path.join(__dirname, 'digest.py');
  const command = boardId
    ? `python "${scriptPath}" --board ${boardId}`
    : `python "${scriptPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Digest error:", error);
      return res.status(500).json({ error: "Failed to run digest" });
    }
    console.log(stdout);
    res.json({ message: "Digest sent successfully!", output: stdout });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});