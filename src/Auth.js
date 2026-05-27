import { useState } from "react";

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");

    const endpoint = isLogin ? "login" : "register";

    try {
      const response = await fetch(`http://localhost:5000/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
      } else {
        if (isLogin) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("email", data.email);
          onLogin(data.email);
        } else {
          setError("");
          setIsLogin(true);
          alert("Registered successfully! Please login.");
        }
      }
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
    }

    setLoading(false);
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#f0f2f5",
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "360px",
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "24px", textAlign: "center" }}>
          {isLogin ? "Login to SyncBoard" : "Create Account"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            boxSizing: "border-box",
            fontSize: "14px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "16px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            boxSizing: "border-box",
            fontSize: "14px",
          }}
        />

        {error && (
          <p style={{ color: "red", fontSize: "13px", marginBottom: "12px" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            background: "#0052cc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "15px",
            marginBottom: "16px",
          }}
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#666" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={{ color: "#0052cc", cursor: "pointer" }}
          >
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;

