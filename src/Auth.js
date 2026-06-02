import { useState, useEffect } from "react";
import { auth, googleProvider, db } from "./firebase"; // Added db
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { ref, set, get } from "firebase/database"; // Added database functions

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

const ACCENT = "#0d9488";

const ACCENT_LIGHT = "#ccfbf1";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("member"); // NEW: Role state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      
      // NEW: Check if this is a new Google user. If so, default them to 'member'
      const userRef = ref(db, `users/${cred.user.uid}`);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, {
          email: cred.user.email,
          name: cred.user.displayName || "Google User",
          role: "member"
        });
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
    }
    setGoogleLoading(false);
  }

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
        
        // NEW: Save the user's selected role to the database upon registration
        await set(ref(db, `users/${cred.user.uid}`), {
          email: email.trim(),
          name: name.trim(),
          role: role 
        });
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
    left: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
      background: "#f8fafc",
      overflowY: "auto",
    },
    formWrapper: { width: "100%", maxWidth: "440px" },
    logo: { textAlign: "center", marginBottom: "20px" },
    logoIcon: {
      width: "60px", height: "60px", background: ACCENT,
      borderRadius: "14px", display: "inline-flex",
      alignItems: "center", justifyContent: "center", marginBottom: "10px",
    },
    logoSvg: { width: "32px", height: "32px", fill: "none", stroke: "white", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" },
    logoText: { fontSize: "26px", fontWeight: "700", color: "#0f172a", margin: "0", letterSpacing: "-0.5px" },
    tagline: { textAlign: "center", color: "#64748b", fontSize: "14px", marginBottom: "28px" },
    tabs: { display: "flex", background: "#e2e8f0", borderRadius: "10px", padding: "4px", marginBottom: "24px", gap: "4px" },
    tab: (active) => ({
      flex: 1, padding: "11px", border: "none",
      background: active ? "white" : "transparent",
      borderRadius: "7px", cursor: "pointer",
      fontSize: "14px", fontWeight: active ? "700" : "500",
      color: active ? ACCENT : "#64748b",
      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
      transition: "all 0.25s",
    }),
    inputGroup: { marginBottom: "16px" },
    label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" },
    inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
    inputIcon: { position: "absolute", left: "13px", fontSize: "15px", opacity: 0.55, zIndex: 2 },
    input: (focused) => ({
      width: "100%", padding: "13px 13px 13px 42px",
      border: `2px solid ${focused ? ACCENT : "#cbd5e1"}`,
      borderRadius: "9px", fontSize: "14px", color: "#0f172a",
      background: "white", outline: "none", transition: "all 0.2s",
      boxShadow: focused ? `0 0 0 3px ${ACCENT_LIGHT}` : "none",
      boxSizing: "border-box",
    }),
    strengthBadge: (strong) => ({
      marginTop: "6px", fontSize: "12px", padding: "5px 10px",
      borderRadius: "5px", display: "inline-block",
      background: strong ? "#dcfce7" : "#fff7ed",
      color: strong ? "#166534" : "#9a3412",
    }),
    errorBox: {
      background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px",
      padding: "11px 14px", marginBottom: "16px",
      display: "flex", alignItems: "center", gap: "9px",
      color: "#b91c1c", fontSize: "13px",
    },
    submitBtn: (load) => ({
      width: "100%", padding: "13px", border: "none", borderRadius: "9px",
      background: load ? "#cbd5e1" : ACCENT, color: "white",
      fontSize: "15px", fontWeight: "600",
      cursor: load ? "not-allowed" : "pointer", transition: "background 0.2s",
    }),
    toggleText: { textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: "16px" },
    toggleSpan: { color: ACCENT, cursor: "pointer", fontWeight: "600" },
    features: {
      display: "flex", justifyContent: "center", gap: "20px",
      marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e2e8f0",
    },
    featureItem: { display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#94a3b8" },
    right: { flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "flex-end" },
    imgEl: {
      position: "absolute", inset: 0, width: "100%", height: "100%",
      objectFit: "cover", transition: "opacity 0.5s ease", opacity: fading ? 0 : 1,
    },
    overlay: {
      position: "absolute", inset: 0,
      background: "linear-gradient(to top, rgba(2,44,53,0.85) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)",
    },
    rightContent: { position: "relative", zIndex: 2, padding: "48px", color: "white", width: "100%" },
    rightHeading: { fontSize: "28px", fontWeight: "700", margin: "0 0 10px", lineHeight: 1.2, letterSpacing: "-0.3px" },
    rightSub: { fontSize: "15px", lineHeight: 1.6, opacity: 0.88, margin: "0 0 24px" },
    dots: { display: "flex", gap: "8px" },
    dot: (active) => ({
      width: active ? "24px" : "8px", height: "8px", borderRadius: "4px",
      background: active ? "white" : "rgba(255,255,255,0.4)",
      cursor: "pointer", transition: "all 0.3s", border: "none", padding: 0,
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

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            style={{
              width: "100%", padding: "12px", borderRadius: "9px",
              border: "2px solid #e2e8f0", background: "white",
              fontSize: "14px", fontWeight: "600", cursor: googleLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "10px", marginBottom: "18px", color: "#334155",
              transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              fontFamily: "inherit",
            }}
            onMouseEnter={e => { if (!googleLoading) { e.currentTarget.style.borderColor = "#4285f4"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(66,133,244,0.2)"; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
          >
            {googleLoading ? (
              <span style={{ fontSize: "14px", color: "#64748b" }}>Signing in with Google...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>or continue with email</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          {/* Name & Role (Only on Register) */}
          {!isLogin && (
            <>
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

              <div style={styles.inputGroup}>
                <label style={styles.label}>Account Role</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>💼</span>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    onFocus={() => setFocusedField("role")} onBlur={() => setFocusedField("")}
                    style={{...styles.input(focusedField === "role"), cursor: "pointer", appearance: "none"}}
                  >
                    <option value="member">Team Member</option>
                    <option value="team_lead">Team Lead</option>
                  </select>
                  <span style={{position: "absolute", right: "14px", pointerEvents: "none", fontSize: "12px"}}>▼</span>
                </div>
              </div>
            </>
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
          <div style={styles.dots}>
            {CAROUSEL_IMAGES.map((_, i) => (
              <button key={i} aria-label={`Go to slide ${i + 1}`}
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