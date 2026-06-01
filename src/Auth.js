import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";

const CAROUSEL_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=1000&fit=crop",
    heading: "Work together, seamlessly",
    sub: "Real-time collaboration and instant sync for high-performing teams.",
  },
  {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=1000&fit=crop",
    heading: "Plan. Track. Deliver.",
    sub: "Visualise your workflow and keep every task moving forward.",
  },
  {
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=1000&fit=crop",
    heading: "Stay in sync, always",
    sub: "Every update reflects instantly across your whole team.",
  },
  {
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=1000&fit=crop",
    heading: "Built for modern teams",
    sub: "From startups to enterprises — SyncBoard scales with you.",
  },
];

const ACCENT = "#0d9488";       // teal-600
const ACCENT_DARK = "#0f766e";  // teal-700
const ACCENT_LIGHT = "#ccfbf1"; // teal-50

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [slide, setSlide] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSlide((s) => (s + 1) % CAROUSEL_IMAGES.length);
        setFading(false);
      }, 500);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isPasswordStrong = (p) => p.length >= 8;

  async function handleSubmit() {
    setError("");
    if (!email || !password) return setError("Please fill in all fields");
    if (!isValidEmail(email)) return setError("Please enter a valid email address");
    if (!isLogin && !isPasswordStrong(password)) return setError("Password must be at least 8 characters");
    if (!isLogin && !name.trim()) return setError("Please enter your name");

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password. Please try again",
        "auth/invalid-credential": "Invalid email or password",
        "auth/email-already-in-use": "An account with this email already exists",
        "auth/weak-password": "Password should be at least 8 characters",
        "auth/invalid-email": "Please enter a valid email address",
      };
      setError(msgs[err.code] || err.message);
    }
    setLoading(false);
  }

  const handleKeyPress = (e) => { if (e.key === "Enter") handleSubmit(); };

  const current = CAROUSEL_IMAGES[slide];

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      width: "100%",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },

    /* ── Left ── */
    left: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
      background: "#f8fafc",
    },
    formWrapper: { width: "100%", maxWidth: "440px" },

    /* Logo */
    logo: { textAlign: "center", marginBottom: "20px" },
    logoIcon: {
      width: "60px",
      height: "60px",
      background: ACCENT,
      borderRadius: "14px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "10px",
    },
    logoSvg: { width: "32px", height: "32px", fill: "none", stroke: "white", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" },
    logoText: { fontSize: "26px", fontWeight: "700", color: "#0f172a", margin: "0", letterSpacing: "-0.5px" },

    tagline: { textAlign: "center", color: "#64748b", fontSize: "14px", marginBottom: "28px" },

    /* Tabs */
    tabs: { display: "flex", background: "#e2e8f0", borderRadius: "10px", padding: "4px", marginBottom: "28px", gap: "4px" },
    tab: (active) => ({
      flex: 1, padding: "11px", border: "none",
      background: active ? "white" : "transparent",
      borderRadius: "7px", cursor: "pointer",
      fontSize: "14px", fontWeight: active ? "700" : "500",
      color: active ? ACCENT : "#64748b",
      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
      transition: "all 0.25s",
    }),

    /* Inputs */
    inputGroup: { marginBottom: "18px" },
    label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" },
    inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
    inputIcon: { position: "absolute", left: "13px", fontSize: "15px", opacity: 0.55, zIndex: 2 },
    input: (focused) => ({
      width: "100%",
      padding: "13px 13px 13px 42px",
      border: `2px solid ${focused ? ACCENT : "#cbd5e1"}`,
      borderRadius: "9px",
      fontSize: "14px",
      color: "#0f172a",
      background: "white",
      outline: "none",
      transition: "all 0.2s",
      boxShadow: focused ? `0 0 0 3px ${ACCENT_LIGHT}` : "none",
      boxSizing: "border-box",
    }),

    strengthBadge: (strong) => ({
      marginTop: "6px",
      fontSize: "12px",
      padding: "5px 10px",
      borderRadius: "5px",
      display: "inline-block",
      background: strong ? "#dcfce7" : "#fff7ed",
      color: strong ? "#166534" : "#9a3412",
    }),

    errorBox: {
      background: "#fef2f2",
      border: "1px solid #fca5a5",
      borderRadius: "8px",
      padding: "11px 14px",
      marginBottom: "18px",
      display: "flex",
      alignItems: "center",
      gap: "9px",
      color: "#b91c1c",
      fontSize: "13px",
    },

    submitBtn: (loading) => ({
      width: "100%",
      padding: "13px",
      border: "none",
      borderRadius: "9px",
      background: loading ? "#cbd5e1" : ACCENT,
      color: "white",
      fontSize: "15px",
      fontWeight: "600",
      cursor: loading ? "not-allowed" : "pointer",
      transition: "background 0.2s",
    }),

    toggleText: { textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: "18px" },
    toggleSpan: { color: ACCENT, cursor: "pointer", fontWeight: "600" },

    features: {
      display: "flex",
      justifyContent: "center",
      gap: "20px",
      marginTop: "28px",
      paddingTop: "24px",
      borderTop: "1px solid #e2e8f0",
    },
    featureItem: { display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#94a3b8" },

    /* ── Right ── */
    right: {
      flex: 1,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "flex-end",
    },
    imgEl: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "opacity 0.5s ease",
      opacity: fading ? 0 : 1,
    },
    overlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to top, rgba(2,44,53,0.85) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)",
    },
    rightContent: {
      position: "relative",
      zIndex: 2,
      padding: "48px",
      color: "white",
      width: "100%",
    },
    rightHeading: { fontSize: "28px", fontWeight: "700", margin: "0 0 10px", lineHeight: 1.2, letterSpacing: "-0.3px" },
    rightSub: { fontSize: "15px", lineHeight: 1.6, opacity: 0.88, margin: "0 0 24px" },

    /* Dots */
    dots: { display: "flex", gap: "8px" },
    dot: (active) => ({
      width: active ? "24px" : "8px",
      height: "8px",
      borderRadius: "4px",
      background: active ? "white" : "rgba(255,255,255,0.4)",
      cursor: "pointer",
      transition: "all 0.3s",
      border: "none",
      padding: 0,
    }),
  };

  return (
    <div style={styles.container}>
      {/* ── Form ── */}
      <div style={styles.left}>
        <div style={styles.formWrapper}>

          {/* Logo */}
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              {/* Kanban-board icon */}
              <svg style={styles.logoSvg} viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="10" rx="1" />
                <rect x="14" y="17" width="7" height="4" rx="1" />
              </svg>
            </div>
            <h1 style={styles.logoText}>SyncBoard</h1>
          </div>

          <p style={styles.tagline}>Real-time collaborative Kanban for teams</p>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button style={styles.tab(isLogin)} onClick={() => { setIsLogin(true); setError(""); }}>Login</button>
            <button style={styles.tab(!isLogin)} onClick={() => { setIsLogin(false); setError(""); }}>Register</button>
          </div>

          {/* Name */}
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input type="text" placeholder="Jane Smith" value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField("")}
                  onKeyPress={handleKeyPress}
                  style={styles.input(focusedField === "name")} />
              </div>
            </div>
          )}

          {/* Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📧</span>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField("")}
                onKeyPress={handleKeyPress}
                style={styles.input(focusedField === "email")} />
            </div>
          </div>

          {/* Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input type="password" placeholder={isLogin ? "Enter your password" : "Min. 8 characters"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField("")}
                onKeyPress={handleKeyPress}
                style={styles.input(focusedField === "password")} />
            </div>
            {!isLogin && password && (
              <div style={styles.strengthBadge(isPasswordStrong(password))}>
                {isPasswordStrong(password) ? "✓ Strong password" : "⚠ Use 8+ characters"}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button style={styles.submitBtn(loading)} onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
          </button>

          {/* Toggle */}
          <p style={styles.toggleText}>
            {isLogin ? "New to SyncBoard? " : "Already have an account? "}
            <span style={styles.toggleSpan} onClick={() => { setIsLogin(!isLogin); setError(""); }}>
              {isLogin ? "Create account" : "Sign in"}
            </span>
          </p>

          {/* Feature pills */}
          <div style={styles.features}>
            {[["🔄", "Real-time sync"], ["👥", "Team collab"], ["🔒", "Secure"]].map(([icon, label]) => (
              <div key={label} style={styles.featureItem}><span>{icon}</span><span>{label}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Carousel ── */}
      <div style={styles.right}>
        <img src={current.url} alt="Team collaboration" style={styles.imgEl} key={slide} />
        <div style={styles.overlay} />

        <div style={styles.rightContent}>
          <h2 style={styles.rightHeading}>{current.heading}</h2>
          <p style={styles.rightSub}>{current.sub}</p>

          {/* Dot indicators */}
          <div style={styles.dots}>
            {CAROUSEL_IMAGES.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                style={styles.dot(i === slide)}
                onClick={() => { setFading(true); setTimeout(() => { setSlide(i); setFading(false); }, 300); }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;