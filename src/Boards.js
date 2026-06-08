import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, set, remove } from "firebase/database";

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

function getInitials(nameStr) {
  if (!nameStr) return "??";
  if (nameStr.includes("@")) return nameStr.charAt(0).toUpperCase();
  const parts = nameStr.trim().split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return nameStr.substring(0, 2).toUpperCase();
}

function getBoardGradient(id) {
  const idx = id ? id.charCodeAt(id.length - 1) % BOARD_GRADIENTS.length : 0;
  return BOARD_GRADIENTS[idx];
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatPopover({ type, boards, userEmail }) {
  const content = (() => {
    if (type === "boards") {
      return (
        <>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>Your Boards</div>
          {boards.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No boards yet.</div>
          ) : (
            boards.map((b, i) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < boards.length - 1 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: getBoardGradient(b.id), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                  {(b.name || "U")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name || "Unnamed Board"}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>{formatDate(b.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </>
      );
    }
    if (type === "pending") {
      const pendingTasks = [];
      boards.forEach(b => {
        const doneIds = b.data?.columns?.done?.cardIds || [];
        const cards = b.data?.cards || {};
        Object.values(cards).forEach(c => {
          if (c.assignee === userEmail && !doneIds.includes(c.id)) pendingTasks.push({ boardName: b.name, ...c });
        });
      });
      return (
        <>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>My Pending Tasks</div>
          {pendingTasks.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>You're all caught up!</div>
          ) : (
            pendingTasks.map((t, i) => (
              <div key={t.id || i} style={{ padding: "10px 0", borderBottom: i < pendingTasks.length - 1 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.text}</div>
                <div style={{ fontSize: 11, color: "#0d9488", marginTop: 3, fontWeight: 700 }}>{t.boardName || "Unnamed Board"}</div>
              </div>
            ))
          )}
        </>
      );
    }
    if (type === "urgent") {
      const urgentTasks = [];
      const now = Date.now();
      boards.forEach(b => {
        const doneIds = b.data?.columns?.done?.cardIds || [];
        const cards = b.data?.cards || {};
        Object.values(cards).forEach(c => {
          if (doneIds.includes(c.id) || !c.dueDate) return;
          const dueTime = new Date(c.dueDate).getTime();
          if (dueTime < now || (dueTime - now) < 172800000) urgentTasks.push({ boardName: b.name, ...c });
        });
      });
      return (
        <>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>Urgent & Overdue</div>
          {urgentTasks.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No urgent tasks!</div>
          ) : (
            urgentTasks.map((t, i) => {
              const isOverdue = new Date(t.dueDate).getTime() < Date.now();
              return (
                <div key={t.id || i} style={{ padding: "10px 0", borderBottom: i < urgentTasks.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.text}</div>
                  <div style={{ display: "flex", gap: 6, fontSize: 11, marginTop: 3, fontWeight: 700 }}>
                    <span style={{ color: isOverdue ? "#ef4444" : "#f59e0b" }}>{isOverdue ? "Overdue" : "Due Soon"}</span>
                    <span style={{ color: "#94a3b8" }}>• {t.boardName || "Unnamed"}</span>
                  </div>
                </div>
              );
            })
          )}
        </>
      );
    }
  })();

  return (
    <div style={{ position: "absolute", top: "calc(100% + 14px)", left: "50%", transform: "translateX(-50%)", zIndex: 999, animation: "popoverIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
      <div style={{ position: "absolute", top: -6, left: "50%", width: 14, height: 14, background: "white", borderTop: "1px solid #e2e8f0", borderLeft: "1px solid #e2e8f0", transform: "translateX(-50%) rotate(45deg)", borderRadius: "2px 0 0 0", zIndex: 2 }} />
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, boxShadow: "0 20px 40px -8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.02)", padding: "18px 20px", width: 280, maxHeight: 320, overflowY: "auto", position: "relative", zIndex: 1 }}>
        {content}
      </div>
    </div>
  );
}

export default function Boards({ user, userRole, onSelectBoard, onLogout }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDeadline, setNewBoardDeadline] = useState("");
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [myPendingCount, setMyPendingCount] = useState(0);
  const [urgentTaskCount, setUrgentTaskCount] = useState(0);
  const [showProfileCard, setShowProfileCard] = useState(false);

  const hoverTimeoutRef = useRef(null);
  const profileTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const isTeamLead = userRole === "team_lead";

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showCreate && inputRef.current) inputRef.current.focus();
  }, [showCreate]);

  useEffect(() => {
    if (!user?.uid) return;
    const userProfileRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userProfileRef, (snap) => {
      if (snap.exists()) setDbUser(snap.val());
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const userEmail = user.email.replace(/\./g, ",");
    const userBoardsRef = ref(db, `userBoards/${userEmail}`);
    const unsubscribe = onValue(userBoardsRef, (snapshot) => {
      if (snapshot.exists()) {
        const boardIds = Object.keys(snapshot.val());
        const boardPromises = boardIds.map(boardId =>
          new Promise(resolve => {
            const boardRef = ref(db, `boards/${boardId}`);
            onValue(boardRef, (snap) => {
              if (snap.exists()) {
                const val = snap.val();
                resolve({ id: boardId, ...val.info, data: val.data });
              } else {
                resolve({ id: boardId, name: "Unnamed Board" });
              }
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

  useEffect(() => {
    let pending = 0;
    let urgent = 0;
    const now = Date.now();
    const fortyEightHours = 48 * 60 * 60 * 1000;
    boards.forEach(board => {
      const cards = board.data?.cards || {};
      const doneIds = board.data?.columns?.done?.cardIds || [];
      Object.values(cards).forEach(card => {
        if (doneIds.includes(card.id)) return;
        if (card.assignee === user.email) pending++;
        if (card.dueDate) {
          const dueTime = new Date(card.dueDate).getTime();
          if (dueTime < now || (dueTime - now) < fortyEightHours) urgent++;
        }
      });
    });
    setMyPendingCount(pending);
    setUrgentTaskCount(urgent);
  }, [boards, user.email]);

  function handleCreateBoard() {
    if (!newBoardName.trim() || !newBoardDeadline) {
      alert("Please enter both a project name and a deadline.");
      return;
    }
    setCreating(true);
    const newBoardId = user.uid + "_" + Date.now();
    const userEmail = user.email.replace(/\./g, ",");
    set(ref(db, `boards/${newBoardId}/info`), {
      name: newBoardName.trim(),
      owner: user.email,
      dueDate: newBoardDeadline,
      members: [user.email],
      createdAt: Date.now(),
    });
    set(ref(db, `userBoards/${userEmail}/${newBoardId}`), true);
    setNewBoardName("");
    setNewBoardDeadline("");
    setCreating(false);
    setShowCreate(false);
  }

  function handleDeleteBoard(e, boardId, boardName) {
    e.stopPropagation();
    if (window.confirm(`⚠️ Are you sure you want to completely delete the project "${boardName}"?`)) {
      remove(ref(db, `boards/${boardId}`));
      const userEmailKey = user.email.replace(/\./g, ",");
      remove(ref(db, `userBoards/${userEmailKey}/${boardId}`));
      setBoards(prev => prev.filter(b => b.id !== boardId));
    }
  }

  function handleStatMouseEnter(type) {
    clearTimeout(hoverTimeoutRef.current);
    setHoveredStat(type);
  }
  function handleStatMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => setHoveredStat(null), 120);
  }

  function handleProfileMouseEnter() {
    clearTimeout(profileTimeoutRef.current);
    setShowProfileCard(true);
  }
  function handleProfileMouseLeave() {
    profileTimeoutRef.current = setTimeout(() => setShowProfileCard(false), 150);
  }

  const sortedBoards = [...boards].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const displayName = dbUser?.name || user.displayName || user.email.split("@")[0];
  const displayPhoto = dbUser?.photoURL || user.photoURL;
  const hasCustomPhoto = displayPhoto &&
    displayPhoto.trim() !== "" &&
    !displayPhoto.includes("Profile_avatar_placeholder");

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
    .nav-logo { width: 38px; height: 38px; background: #0d9488; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(13,148,136,0.35); }
    .nav-logo svg { width: 20px; height: 20px; stroke: white; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .nav-title { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; }
    .nav-right { display: flex; align-items: center; gap: 10px; }

    .profile-trigger {
      display: flex; align-items: center; gap: 10px;
      cursor: pointer; position: relative;
      padding: 5px 10px; border-radius: 10px;
      transition: background 0.2s;
    }
    .profile-trigger:hover { background: #f1f5f9; }

    .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #0d9488, #0ea5e9); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; box-shadow: 0 2px 8px rgba(13,148,136,0.3); flex-shrink: 0; }
    .user-name { font-size: 13px; color: #475569; font-weight: 600; }

    .profile-card {
      position: absolute; top: calc(100% + 12px); right: 0;
      background: white; border: 1px solid #e2e8f0; border-radius: 16px;
      box-shadow: 0 20px 40px -8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.02);
      padding: 20px; width: 240px; z-index: 999;
      animation: popoverIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .profile-card-arrow {
      position: absolute; top: -6px; right: 24px;
      width: 14px; height: 14px; background: white;
      border-top: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0;
      transform: rotate(45deg); border-radius: 2px 0 0 0;
    }
    .profile-card-photo {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #0d9488, #0ea5e9);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 700; color: white;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(13,148,136,0.25);
    }

    .btn-danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-danger:hover { background: #fee2e2; }

    .main { max-width: 1100px; margin: 0 auto; padding: 40px 32px; position: relative; z-index: 1; }

    .hero-banner { background: linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%); border-radius: 20px; padding: 36px 40px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
    .hero-banner::before { content: ''; position: absolute; top: -40px; right: -40px; width: 220px; height: 220px; background: rgba(255,255,255,0.08); border-radius: 50%; }
    .hero-banner::after { content: ''; position: absolute; bottom: -60px; right: 120px; width: 160px; height: 160px; background: rgba(255,255,255,0.06); border-radius: 50%; }
    .hero-text h2 { font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.5px; margin-bottom: 6px; }
    .hero-text p { font-size: 14px; color: rgba(255,255,255,0.8); }
    .hero-btn { background: white; color: #0d9488; padding: 11px 22px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 7px; transition: all 0.2s; position: relative; z-index: 1; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; border-radius: 16px; padding: 22px 24px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 16px; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; position: relative; cursor: default; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); border-color: #0d9488; }
    .stat-icon-wrap { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
    .stat-label { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .stat-value { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .stat-hint { font-size: 12px; margin-top: 2px; font-weight: 500; }

    @keyframes popoverIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    .section-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .section-label::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }

    .boards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
    .board-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; cursor: pointer; transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s; animation: cardIn 0.4s ease both; }
    .board-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); border-color: #cbd5e1; }
    .board-card-banner { position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; padding: 20px; min-height: 90px; }
    .board-card-title-white { font-size: 18px; font-weight: 800; color: white; margin-bottom: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.15); line-height: 1.2; }
    .board-name-badge { background: rgba(255,255,255,0.25); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: white; }
    .board-card-body { padding: 16px 20px 14px; }
    .board-card-meta { font-size: 12px; color: #64748b; display: flex; gap: 10px; align-items: center; font-weight: 500; }
    .meta-dot { width: 4px; height: 4px; border-radius: 50%; background: #cbd5e1; }
    .board-card-footer { padding: 12px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
    .member-avatar { width: 26px; height: 26px; border-radius: 50%; background: #f0fdfa; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #0d9488; }
    .member-count { font-size: 12px; color: #64748b; font-weight: 600; margin-left: 8px; }
    .open-pill { font-size: 12px; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 4px; transition: color 0.2s; }
    .board-card:hover .open-pill { color: #0d9488; }
    .open-arrow { transition: transform 0.2s; display: inline-block; }
    .board-card:hover .open-arrow { transform: translateX(3px); }

    .empty { text-align: center; padding: 72px 32px; background: white; border: 1.5px dashed #cbd5e1; border-radius: 16px; }
    .empty-icon { font-size: 44px; margin-bottom: 14px; }
    .empty h3 { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 6px; }
    .empty p { font-size: 14px; color: #94a3b8; }

    .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; background: #f1f5f9; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #0d9488; border-radius: 50%; animation: spin 0.7s linear infinite; }
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

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowCreate(false)}>
          <div style={{ background: "white", padding: 32, borderRadius: 16, width: 420, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", animation: "popoverIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 20, color: "#0f172a" }}>Create New Board</h3>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Set up a new project workspace for your team.</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, letterSpacing: "0.5px" }}>BOARD NAME</label>
              <input ref={inputRef} value={newBoardName} onChange={e => setNewBoardName(e.target.value)} placeholder="e.g. Q3 Product Roadmap" style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "2px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "0.2s", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#0d9488"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
            </div>
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, letterSpacing: "0.5px" }}>DEADLINE</label>
              <input type="date" value={newBoardDeadline} onChange={e => setNewBoardDeadline(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "2px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "0.2s", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#0d9488"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: "10px 20px", background: "transparent", border: "none", color: "#64748b", fontWeight: 600, cursor: "pointer", borderRadius: 8, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleCreateBoard} disabled={creating || !newBoardName.trim() || !newBoardDeadline} style={{ padding: "10px 24px", background: "#0d9488", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(13,148,136,0.2)" }}>{creating ? "Creating..." : "Create Board"}</button>
            </div>
          </div>
        </div>
      )}

      <div className={`boards-root${mounted ? " mounted" : ""}`}>
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-logo">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" /><rect x="14" y="17" width="7" height="4" rx="1" /></svg>
            </div>
            <span className="nav-title">SyncBoard</span>
          </div>

          <div className="nav-right">
            {isTeamLead && (
              <div style={{ marginRight: 8, padding: "4px 8px", background: "#fef08a", color: "#854d0e", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                Team Lead
              </div>
            )}

            <div
              className="profile-trigger"
              onMouseEnter={handleProfileMouseEnter}
              onMouseLeave={handleProfileMouseLeave}
            >
              {/* Avatar — img directly if photo, initials div if not */}
              {hasCustomPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0, boxShadow: "0 2px 8px rgba(13,148,136,0.3)" }}
                />
              ) : (
                <div className="avatar">{getInitials(displayName)}</div>
              )}

              <span className="user-name">{displayName}</span>

              {showProfileCard && (
                <div
                  className="profile-card"
                  onMouseEnter={handleProfileMouseEnter}
                  onMouseLeave={handleProfileMouseLeave}
                >
                  <div className="profile-card-arrow" />

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
                    {/* Profile card photo */}
                    {hasCustomPhoto ? (
                      <img
                        src={displayPhoto}
                        alt="Profile"
                        referrerPolicy="no-referrer"
                        style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", display: "block", marginBottom: 10, boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}
                      />
                    ) : (
                      <div className="profile-card-photo">{getInitials(displayName)}</div>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", textAlign: "center" }}>{displayName}</div>
                    <div style={{ marginTop: 6, padding: "3px 12px", background: isTeamLead ? "#fef08a" : "#f0fdfa", color: isTeamLead ? "#854d0e" : "#0d9488", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {isTeamLead ? "⭐ Team Lead" : "👤 Team Member"}
                    </div>
                  </div>

                  <div style={{ height: 1, background: "#f1f5f9", marginBottom: 14 }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, color: "#475569", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button className="btn-danger" onClick={onLogout}>Sign out</button>
          </div>
        </nav>

        <main className="main">
          <div className="hero-banner">
            <div className="hero-text">
              <h2>Welcome back, {displayName} 👋</h2>
              <p>You have {boards.length} board{boards.length !== 1 ? "s" : ""} — pick up where you left off.</p>
            </div>
            {isTeamLead && (
              <button className="hero-btn" onClick={() => setShowCreate(true)}>
                <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span> New Board
              </button>
            )}
          </div>

          <div className="stats-row">
            <div className="stat-card" style={{ zIndex: hoveredStat === "boards" ? 50 : 1 }} onMouseEnter={() => handleStatMouseEnter("boards")} onMouseLeave={handleStatMouseLeave}>
              <div className="stat-icon-wrap" style={{ background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)" }}>📋</div>
              <div style={{ flex: 1 }}>
                <div className="stat-label">Total Boards</div>
                <div className="stat-value">{boards.length}</div>
                <div className="stat-hint" style={{ color: "#0d9488" }}>Hover to see all</div>
              </div>
              {hoveredStat === "boards" && <StatPopover type="boards" boards={boards} userEmail={user.email} />}
            </div>

            <div className="stat-card" style={{ zIndex: hoveredStat === "pending" ? 50 : 1 }} onMouseEnter={() => handleStatMouseEnter("pending")} onMouseLeave={handleStatMouseLeave}>
              <div className="stat-icon-wrap" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>📝</div>
              <div style={{ flex: 1 }}>
                <div className="stat-label">My Pending Tasks</div>
                <div className="stat-value">{myPendingCount}</div>
                <div className="stat-hint" style={{ color: "#3b82f6" }}>Assigned directly to you</div>
              </div>
              {hoveredStat === "pending" && <StatPopover type="pending" boards={boards} userEmail={user.email} />}
            </div>

            <div className="stat-card" style={{ zIndex: hoveredStat === "urgent" ? 50 : 1 }} onMouseEnter={() => handleStatMouseEnter("urgent")} onMouseLeave={handleStatMouseLeave}>
              <div className="stat-icon-wrap" style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)" }}>⏰</div>
              <div style={{ flex: 1 }}>
                <div className="stat-label">Due Soon & Overdue</div>
                <div className="stat-value">{urgentTaskCount}</div>
                <div className="stat-hint" style={{ color: "#ef4444" }}>Requires immediate attention</div>
              </div>
              {hoveredStat === "urgent" && <StatPopover type="urgent" boards={boards} userEmail={user.email} />}
            </div>
          </div>

          {boards.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🗂️</div>
              <h3>No boards yet</h3>
              <p>{isTeamLead ? "Create your first board using the button above." : "You haven't been added to any boards yet."}</p>
            </div>
          ) : (
            <>
              <div className="section-label">All boards — {boards.length}</div>
              <div className="boards-grid">
                {sortedBoards.map((board, i) => {
                  const gradient = getBoardGradient(board.id);
                  let badgeStyle = { bg: "#f1f5f9", text: "#64748b", icon: "📅", label: board.dueDate || "No deadline" };
                  if (board.dueDate) {
                    const daysLeft = Math.ceil((new Date(board.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                    if (daysLeft < 0) badgeStyle = { bg: "#fee2e2", text: "#b91c1c", icon: "🔥", label: `Overdue by ${Math.abs(daysLeft)}d` };
                    else if (daysLeft <= 2) badgeStyle = { bg: "#fef3c7", text: "#b45309", icon: "⚠️", label: `Due in ${daysLeft}d` };
                    else badgeStyle = { bg: "#dcfce7", text: "#15803d", icon: "✅", label: `${daysLeft}d left` };
                  }
                  return (
                    <div key={board.id} className="board-card" style={{ animationDelay: `${i * 70}ms` }} onClick={() => onSelectBoard(board.id)}>
                      <div className="board-card-banner" style={{ background: gradient }}>
                        {isTeamLead && (
                          <button
                            onClick={(e) => handleDeleteBoard(e, board.id, board.name)}
                            style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 6, color: "white", padding: "6px 8px", cursor: "pointer", zIndex: 10, fontSize: 14, backdropFilter: "blur(4px)", transition: "0.2s" }}
                            title="Delete Board"
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.9)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.3)"}
                          >🗑️</button>
                        )}
                        <div className="board-card-title-white">{board.name || "Unnamed Board"}</div>
                        <span className="board-name-badge">Workspace</span>
                      </div>
                      <div className="board-card-body">
                        <div className="board-card-meta">
                          <span>🕐 {formatDate(board.createdAt)}</span>
                          <span className="meta-dot" />
                          <span>{board.owner === user.email ? "Owned by you" : "Shared project"}</span>
                        </div>
                        <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: badgeStyle.bg, color: badgeStyle.text }}>
                          {badgeStyle.icon} {badgeStyle.label}
                        </div>
                      </div>
                      <div className="board-card-footer">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {(board.members || [user.email]).slice(0, 3).map((m, idx) => (
                            <div key={idx} className="member-avatar" style={{ marginLeft: idx > 0 ? "-6px" : 0 }}>{getInitials(m)}</div>
                          ))}
                          <span className="member-count">{(board.members || []).length} member{(board.members || []).length !== 1 ? "s" : ""}</span>
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