const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://syncboard-f83b4-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const usersRef = db.ref("users");
    const snapshot = await usersRef.orderByChild("email").equalTo(email).once("value");
    
    if (snapshot.exists()) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = usersRef.push();
    await newUserRef.set({
      id: newUserRef.key,
      email,
      password: hashedPassword,
    });

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const usersRef = db.ref("users");
    const snapshot = await usersRef.orderByChild("email").equalTo(email).once("value");

    if (!snapshot.exists()) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    let user;
    snapshot.forEach(child => { user = child.val(); });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({ token, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;