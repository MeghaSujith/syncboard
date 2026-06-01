import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, set } from "firebase/database";

const ACCENT = "#0d9488";
const ACCENT_DARK = "#0f766e";
const ACCENT_LIGHT = "#f0fdfa";

const BOARD_GRADIENTS = [
  "linear-gradient(135deg, #0d9488, #0ea5e9)",
  "linear-gradient(135deg, #8b5cf6, #6366f1)",
  "linear-gradient(135deg, #f59e0b, #f97316)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "linear-gradient(135deg, #10b981, #0d9488)",
  "linear-gradient(135deg, #f97316, #ef4444)",
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #0d9488, #10b981)",
];

function getInitials(email) {
  return email ? email.slice(0, 2).toUpperCase() : "??";
}

function getBoardGradient(id) {
  const idx = id ? id.charCodeAt(id.length - 1) % BOARD_GRADIENTS.length : 0;
  return BOARD_GRADIENTS[idx];
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Stat Popover Component ───────────────────────────────────────────────────
function StatPopover({ type, boards, userEmail }) {
  const content = (() => {
    if (type === "boards") {
      return (
        <>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
            Your Boards
          </div>
          {boards.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No boards yet.</div>
          ) : (
            boards.map((b, i) => (
              <div key={b.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 0",
                borderBottom: i < boards.length - 1 ? "1px solid #f8fafc" : "none",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: getBoardGradient(b.id),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 12, color: "rgba(255,255,255,0.9)",
                }}>
                  {(b.name || "U")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.name || "Unnamed Board"}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                    {formatDate(b.createdAt)} · {(b.members || []).length} member{(b.members || []).length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 7px",
                  borderRadius: 5, flexShrink: 0,
                  background: b.owner === userEmail ? "#f0fdfa" : "#f8fafc",
                  color: b.owner === userEmail ? "#0d9488" : "#94a3b8",
                }}>
                  {b.owner === userEmail ? "Owner" : "Member"}
                </div>
              </div>
            ))
          )}
        </>
      );
    }

    if (type === "collaborators") {
      const allMembers = [...new Set(boards.flatMap(b => b.members || []))];
      const others = allMembers.filter(m => m !== userEmail);
      return (
        <>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
            All Collaborators
          </div>
          {/* You */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #f8fafc" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #0d9488, #0ea5e9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 11, color: "white",
            }}>
              {getInitials(userEmail)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userEmail}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>You</div>
            </div>
          </div>
          {others.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13, paddingTop: 8 }}>No other collaborators yet.</div>
          ) : (
            others.map((m, i) => {
              const sharedBoards = boards.filter(b => (b.members || []).includes(m));
              return (
                <div key={m} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "7px 0",
                  borderBottom: i < others.length - 1 ? "1px solid #f8fafc" : "none",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "#e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 11, color: "#64748b",
                  }}>
                    {m.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                      {sharedBoards.length} shared board{sharedBoards.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </>
      );
    }

    if (type === "active") {
      const today = boards.filter(b => b.createdAt && Date.now() - b.createdAt < 86400000);
      const recent = boards.filter(b => b.createdAt && Date.now() - b.createdAt < 7 * 86400000);
      return (
        <>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
            Activity Summary
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[
              { label: "Created today", value: today.length, bg: "#f0fdfa", color: "#0d9488" },
              { label: "This week", value: recent.length, bg: "#eff6ff", color: "#3b82f6" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {today.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "8px 0" }}>
              No boards created today yet.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
                Created Today
              </div>
              {today.map((b, i) => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "7px 0",
                  borderBottom: i < today.length - 1 ? "1px solid #f8fafc" : "none",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: getBoardGradient(b.id),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 12, color: "rgba(255,255,255,0.9)",
                  }}>
                    {(b.name || "U")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {b.name || "Unnamed Board"}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                      {formatDate(b.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      );
    }
  })();

  return (
    <div style={{
      position: "absolute",
      top: "calc(100% + 10px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 999,
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      boxShadow: "0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
      padding: "14px 16px",
      width: 260,
      maxHeight: 320,
      overflowY: "auto",
      animation: "popoverIn 0.18s ease",
    }}>
      {/* arrow */}
      <div style={{
        position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
        width: 12, height: 12, background: "white",
        border: "1px solid #e2e8f0", borderRight: "none", borderBottom: "none",
        transform: "translateX(-50%) rotate(45deg)",
      }} />
      {content}
    </div>
  );
}

export default function Boards({ user, onSelectBoard, onLogout }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  // ─── NEW: track which stat card is hovered ────────────────────────────────
  const [hoveredStat, setHoveredStat] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showCreate && inputRef.current) inputRef.current.focus();
  }, [showCreate]);

  useEffect(() => {
    const userEmail = user.email.replace(/\./g, ",");
    const userBoardsRef = ref(db, `userBoards/${userEmail}`);
    const unsubscribe = onValue(userBoardsRef, (snapshot) => {
      if (snapshot.exists()) {
        const boardIds = Object.keys(snapshot.val());
        const boardPromises = boardIds.map(boardId =>
          new Promise(resolve => {
            const boardInfoRef = ref(db, `boards/${boardId}/info`);
            onValue(boardInfoRef, (infoSnap) => {
              resolve(infoSnap.exists()
                ? { id: boardId, ...infoSnap.val() }
                : { id: boardId, name: "Unnamed Board" });
            }, { onlyOnce: true });
          })
        );
        Promise.all(boardPromises).then(list => { setBoards(list); setLoading(false); });
      } else {
        setBoards([]); setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [user]);

  function handleCreateBoard() {
    if (!newBoardName.trim()) return;
    setCreating(true);
    const newBoardId = user.uid + "_" + Date.now();
    const userEmail = user.email.replace(/\./g, ",");
    set(ref(db, `boards/${newBoardId}/info`), {
      name: newBoardName.trim(),
      owner: user.email,
      members: [user.email],
      createdAt: Date.now(),
    });
    set(ref(db, `userBoards/${userEmail}/${newBoardId}`), true);
    setNewBoardName("");
    setCreating(false);
    setShowCreate(false);
  }

  async function handleSendDigest() {
    setSendingDigest(true);
    try {
      const res = await fetch("http://localhost:5000/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      alert(data.message || "Digest sent!");
    } catch {
      alert("Failed to send digest. Is the backend running?");
    } finally {
      setSendingDigest(false);
    }
  }

  // ─── Hover handlers with a small delay to avoid flicker ──────────────────
  function handleStatMouseEnter(type) {
    clearTimeout(hoverTimeoutRef.current);
    setHoveredStat(type);
  }
  function handleStatMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => setHoveredStat(null), 120);
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .boards-root {
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      background: #f1f5f9;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.45s ease, transform 0.45s ease;
      position: relative;
    }
    .boards-root.mounted { opacity: 1; transform: translateY(0); }

    .boards-root::before {
      content: '';
      position: fixed; inset: 0;
      background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px);
      background-size: 28px 28px;
      opacity: 0.45;
      pointer-events: none; z-index: 0;
    }

    .nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid #e2e8f0;
      padding: 0 36px; height: 66px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .nav-brand { display: flex; align-items: center; gap: 10px; }
    .nav-logo {
      width: 38px; height: 38px; background: #0d9488;
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(13,148,136,0.35);
    }
    .nav-logo svg { width: 20px; height: 20px; stroke: white; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .nav-title { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; }
    .nav-right { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #0d9488, #0ea5e9);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: white;
      box-shadow: 0 2px 8px rgba(13,148,136,0.3);
    }
    .user-email { font-size: 13px; color: #475569; font-weight: 500; }
    .btn {
      padding: 8px 16px; border: none; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.2s; font-family: inherit;
      display: flex; align-items: center; gap: 6px;
    }
    .btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
    .btn-ghost:hover { background: #f1f5f9; color: #0f172a; }
    .btn-teal { background: #0d9488; color: white; box-shadow: 0 2px 8px rgba(13,148,136,0.3); }
    .btn-teal:hover { background: #0f766e; box-shadow: 0 4px 14px rgba(13,148,136,0.4); transform: translateY(-1px); }
    .btn-teal:disabled { background: #cbd5e1; box-shadow: none; transform: none; cursor: not-allowed; }
    .btn-danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .btn-danger:hover { background: #fee2e2; }

    .main { max-width: 1100px; margin: 0 auto; padding: 40px 32px; position: relative; z-index: 1; }

    .hero-banner {
      background: linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%);
      border-radius: 20px; padding: 36px 40px; margin-bottom: 28px;
      display: flex; align-items: center; justify-content: space-between;
      position: relative; overflow: hidden;
    }
    .hero-banner::before {
      content: ''; position: absolute; top: -40px; right: -40px;
      width: 220px; height: 220px;
      background: rgba(255,255,255,0.08); border-radius: 50%;
    }
    .hero-banner::after {
      content: ''; position: absolute; bottom: -60px; right: 120px;
      width: 160px; height: 160px;
      background: rgba(255,255,255,0.06); border-radius: 50%;
    }
    .hero-text h2 { font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.5px; margin-bottom: 6px; }
    .hero-text p { font-size: 14px; color: rgba(255,255,255,0.8); }
    .hero-btn {
      background: white; color: #0d9488;
      padding: 11px 22px; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
      display: flex; align-items: center; gap: 7px;
      transition: all 0.2s; white-space: nowrap;
      position: relative; z-index: 1;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card {
      background: white; border-radius: 16px; padding: 22px 24px;
      border: 1px solid #e2e8f0;
      display: flex; align-items: center; gap: 16px;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      position: relative;
      cursor: default;
    }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); border-color: #0d9488; }
    .stat-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .stat-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .stat-value { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .stat-hint { font-size: 11px; color: #0d9488; margin-top: 2px; opacity: 0.8; }

    @keyframes popoverIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .create-panel { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 32px; }
    .create-header { padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.15s; }
    .create-header:hover { background: #f8fafc; }
    .create-header-left { display: flex; align-items: center; gap: 14px; }
    .create-plus-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: #f0fdfa; color: #0d9488;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 300; line-height: 1;
      border: 1.5px dashed #0d9488;
    }
    .create-title { font-size: 14px; font-weight: 700; color: #0f172a; }
    .create-sub { font-size: 12px; color: #94a3b8; margin-top: 1px; }
    .create-chevron { font-size: 20px; color: #94a3b8; transition: transform 0.25s; display: inline-block; }
    .create-chevron.open { transform: rotate(90deg); }
    .create-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease; padding: 0 24px; }
    .create-body.open { max-height: 120px; padding: 0 24px 20px; }
    .create-input-row { display: flex; gap: 10px; }
    .create-input {
      flex: 1; padding: 12px 14px; border: 2px solid #e2e8f0; border-radius: 10px;
      font-size: 14px; color: #0f172a; font-family: inherit; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s; background: #f8fafc;
    }
    .create-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px #f0fdfa; background: white; }

    .section-label {
      font-size: 11px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .section-label::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }

    .boards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }

    .board-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 16px;
      overflow: hidden; cursor: pointer;
      transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
      animation: cardIn 0.4s ease both;
    }
    .board-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); border-color: #cbd5e1; }
    @keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    .board-card-banner {
      height: 80px; position: relative; overflow: hidden;
      display: flex; align-items: flex-end; padding: 12px 16px;
    }
    .board-card-banner-letter {
      font-size: 42px; font-weight: 800;
      color: rgba(255,255,255,0.2);
      position: absolute; right: 14px; top: 6px;
      line-height: 1; letter-spacing: -2px; user-select: none;
    }
    .board-name-badge {
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px; padding: 3px 8px;
      font-size: 11px; font-weight: 700; color: white; letter-spacing: 0.3px;
    }
    .board-card-body { padding: 16px 18px 14px; }
    .board-card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .board-card-meta { font-size: 12px; color: #94a3b8; display: flex; gap: 10px; align-items: center; }
    .meta-dot { width: 3px; height: 3px; border-radius: 50%; background: #cbd5e1; }
    .board-card-footer {
      padding: 11px 18px; background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      display: flex; align-items: center; justify-content: space-between;
    }
    .member-stack { display: flex; align-items: center; }
    .member-avatar {
      width: 24px; height: 24px; border-radius: 50%;
      background: #f0fdfa; border: 2px solid white;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700; color: #0d9488;
    }
    .member-count { font-size: 12px; color: #64748b; font-weight: 500; margin-left: 8px; }
    .open-pill { font-size: 12px; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 4px; transition: color 0.2s; }
    .board-card:hover .open-pill { color: #0d9488; }
    .open-arrow { transition: transform 0.2s; display: inline-block; }
    .board-card:hover .open-arrow { transform: translateX(3px); }

    .empty {
      text-align: center; padding: 72px 32px;
      background: white; border: 1.5px dashed #cbd5e1; border-radius: 16px;
    }
    .empty-icon { font-size: 44px; margin-bottom: 14px; }
    .empty h3 { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 6px; }
    .empty p { font-size: 14px; color: #94a3b8; }

    .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; background: #f1f5f9; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #0d9488; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="loading"><div className="spinner" /></div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className={`boards-root${mounted ? " mounted" : ""}`}>

        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-logo">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="10" rx="1" />
                <rect x="14" y="17" width="7" height="4" rx="1" />
              </svg>
            </div>
            <span className="nav-title">SyncBoard</span>
          </div>
          <div className="nav-right">
            <div className="avatar">{getInitials(user.email)}</div>
            <span className="user-email">{user.email}</span>
            <button className="btn btn-ghost" onClick={handleSendDigest} disabled={sendingDigest}>
              {sendingDigest ? "Sending…" : "📧 Send Digest"}
            </button>
            <button className="btn btn-danger" onClick={onLogout}>Sign out</button>
          </div>
        </nav>

        <main className="main">

          <div className="hero-banner">
            <div className="hero-text">
              <h2>Welcome back, {user.displayName || user.email.split("@")[0]} 👋</h2>
              <p>You have {boards.length} board{boards.length !== 1 ? "s" : ""} — pick up where you left off.</p>
            </div>
            <button className="hero-btn" onClick={() => setShowCreate(s => !s)}>
              <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span> New Board
            </button>
          </div>

          {/* ─── Stats Row with hover popovers ─────────────────────────── */}
          <div className="stats-row">

            {/* Total Boards */}
            <div
              className="stat-card"
              onMouseEnter={() => handleStatMouseEnter("boards")}
              onMouseLeave={handleStatMouseLeave}
            >
              <div className="stat-icon-wrap" style={{ background: "#f0fdfa" }}>📋</div>
              <div style={{ flex: 1 }}>
                <div className="stat-label">Total Boards</div>
                <div className="stat-value">{boards.length}</div>
                <div className="stat-hint">Hover to see all</div>
              </div>
              {hoveredStat === "boards" && (
                <StatPopover type="boards" boards={boards} userEmail={user.email} />
              )}
            </div>

            {/* Collaborators */}
            <div
              className="stat-card"
              onMouseEnter={() => handleStatMouseEnter("collaborators")}
              onMouseLeave={handleStatMouseLeave}
            >
              <div className="stat-icon-wrap" style={{ background: "#eff6ff" }}>👥</div>
              <div style={{ flex: 1 }}>
                <div className="stat-label">Collaborators</div>
                <div className="stat-value">{[...new Set(boards.flatMap(b => b.members || []))].length}</div>
                <div className="stat-hint">Hover to see all</div>
              </div>
              {hoveredStat === "collaborators" && (
                <StatPopover type="collaborators" boards={boards} userEmail={user.email} />
              )}
            </div>

            {/* Active Today */}
            <div
              className="stat-card"
              onMouseEnter={() => handleStatMouseEnter("active")}
              onMouseLeave={handleStatMouseLeave}
            >
              <div className="stat-icon-wrap" style={{ background: "#fefce8" }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div className="stat-label">Active Today</div>
                <div className="stat-value">{boards.filter(b => b.createdAt && Date.now() - b.createdAt < 86400000).length}</div>
                <div className="stat-hint">Hover for activity</div>
              </div>
              {hoveredStat === "active" && (
                <StatPopover type="active" boards={boards} userEmail={user.email} />
              )}
            </div>

          </div>
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="create-panel">
            <div className="create-header" onClick={() => setShowCreate(s => !s)}>
              <div className="create-header-left">
                <div className="create-plus-icon">+</div>
                <div>
                  <div className="create-title">Create a new board</div>
                  <div className="create-sub">Start a fresh project workspace</div>
                </div>
              </div>
              <span className={`create-chevron${showCreate ? " open" : ""}`}>›</span>
            </div>
            <div className={`create-body${showCreate ? " open" : ""}`}>
              <div className="create-input-row">
                <input
                  ref={inputRef}
                  className="create-input"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateBoard()}
                  placeholder="e.g. Q3 Product Roadmap"
                />
                <button className="btn btn-teal" onClick={handleCreateBoard} disabled={creating || !newBoardName.trim()}>
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>

          {boards.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🗂️</div>
              <h3>No boards yet</h3>
              <p>Create your first board above to get started.</p>
            </div>
          ) : (
            <>
              <div className="section-label">All boards — {boards.length}</div>
              <div className="boards-grid">
                {boards.map((board, i) => {
                  const gradient = getBoardGradient(board.id);
                  const firstLetter = (board.name || "U")[0].toUpperCase();
                  return (
                    <div
                      key={board.id}
                      className="board-card"
                      style={{ animationDelay: `${i * 70}ms` }}
                      onClick={() => onSelectBoard(board.id)}
                    >
                      <div className="board-card-banner" style={{ background: gradient }}>
                        <span className="board-card-banner-letter">{firstLetter}</span>
                        <span className="board-name-badge">Board</span>
                      </div>
                      <div className="board-card-body">
                        <div className="board-card-title">{board.name || "Unnamed Board"}</div>
                        <div className="board-card-meta">
                          <span>🕐 {formatDate(board.createdAt)}</span>
                          <span className="meta-dot" />
                          <span>{board.owner === user.email ? "Owned by you" : board.owner}</span>
                        </div>
                      </div>
                      <div className="board-card-footer">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className="member-stack">
                            {(board.members || [user.email]).slice(0, 3).map((m, idx) => (
                              <div key={idx} className="member-avatar" style={{ marginLeft: idx > 0 ? "-6px" : 0 }}>
                                {m.slice(0, 1).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <span className="member-count">
                            {(board.members || []).length} member{(board.members || []).length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="open-pill">Open <span className="open-arrow">→</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}