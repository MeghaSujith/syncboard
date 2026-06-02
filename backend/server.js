const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { exec } = require('child_process');
const path = require('path');

// 1. Explicitly load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// 2. Configure CORS to explicitly allow your React frontend
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["POST", "GET"],
  credentials: true
}));

app.use(express.json());

app.post("/api/digest", (req, res) => {
  // 3. Ensure we are correctly pulling data from the request body
  const { boardId, boardName } = req.body;
  
  if (!boardId) {
    return res.status(400).json({ error: "Board ID is required" });
  }

  const scriptPath = path.join(__dirname, 'digest.py');
  
  // Use a cleaner command structure
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});