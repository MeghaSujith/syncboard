import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

const ACCENT = "#0d9488";

const LABEL_COLORS = [
  { id: "red",    bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444", name: "Bug"      },
  { id: "amber",  bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", name: "Feature"  },
  { id: "green",  bg: "#dcfce7", text: "#166534", dot: "#22c55e", name: "Improve"  },
  { id: "blue",   bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6", name: "Docs"     },
  { id: "purple", bg: "#ede9fe", text: "#5b21b6", dot: "#8b5cf6", name: "Design"   },
  { id: "pink",   bg: "#fce7f3", text: "#9d174d", dot: "#ec4899", name: "Research" },
];

const PRIORITY_CONFIG = {
  low:      { label: "Low",    color: "#22c55e", bg: "#dcfce7", text: "#166534" },
  medium:   { label: "Medium", color: "#f59e0b", bg: "#fef3c7", text: "#92400e" },
  high:     { label: "High",   color: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
  critical: { label: "🔥",     color: "#7c3aed", bg: "#ede9fe", text: "#5b21b6" },
};

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function CardDetailModal({ card, onClose, onUpdate, onDelete, user, logActivity, boardName, boardId, userRole
}) {
  const isTeamLead = userRole === "team_lead";
  console.log("userRole received:", userRole, "isTeamLead:", isTeamLead);
  const [title, setTitle]       = useState(card.text);
  const [desc, setDesc]         = useState(card.description || "");
  const [dueDate, setDueDate]   = useState(card.dueDate || "");
  const [assignee, setAssignee] = useState(card.assignee || "");
  const [priority, setPriority] = useState(card.priority || "medium");
  const [labels, setLabels]     = useState(card.labels || []);
  const [comment, setComment]   = useState("");
  const [comments, setComments] = useState(card.comments || []);
  const [tab, setTab]           = useState("details");
  const [members, setMembers]   = useState([]); // [{email, name}]
  const [assignEmailStatus, setAssignEmailStatus] = useState("");

  // Load all board members' profiles from DB
  useEffect(() => {
    if (!boardId) return;
    const boardInfoRef = ref(db, `boards/${boardId}/info/members`);
    onValue(boardInfoRef, (snap) => {
      if (!snap.exists()) return;
      const emails = snap.val(); // array of emails
      const memberProfiles = [];
      let loaded = 0;
      emails.forEach(email => {
        // look up each member's profile by email
        const usersRef = ref(db, "users");
        onValue(usersRef, (usersSnap) => {
          if (usersSnap.exists()) {
            const allUsers = Object.values(usersSnap.val());
            const profile = allUsers.find(u => u.email === email);
            memberProfiles.push({ email, name: profile?.name || email.split("@")[0] });
          } else {
            memberProfiles.push({ email, name: email.split("@")[0] });
          }
          loaded++;
          if (loaded === emails.length) setMembers([...memberProfiles]);
        }, { onlyOnce: true });
      });
    }, { onlyOnce: true });
  }, [boardId]);

  function getDisplayName(email) {
    const member = members.find(m => m.email === email);
    return member ? member.name : email.split("@")[0];
  }

  async function handleSave() {
    const prevAssignee = card.assignee || "";
    onUpdate(card.id, { text: title, description: desc, dueDate, assignee, priority, labels, comments });

    // Send assignment email only if assignee changed
    if (assignee && assignee !== prevAssignee && assignee.includes("@")) {
      setAssignEmailStatus("sending");
      try {
        const res = await fetch("http://localhost:5000/api/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assigneeEmail: assignee,
            assigneeName: getDisplayName(assignee),
            cardTitle: title,
            cardDescription: desc,
            dueDate: dueDate,
            priority: priority,
            boardName: boardName || "Your Board",
            assignedBy: user.email,
          }),
        });
        if (res.ok) {
          setAssignEmailStatus("sent");
        } else {
          setAssignEmailStatus("failed");
        }
      } catch (e) {
        console.error("Assignment email failed:", e);
        setAssignEmailStatus("failed");
      }
    }
    onClose();
  }

  function handleAddComment() {
    if (!comment.trim()) return;
    const newComment = { id: Date.now(), text: comment.trim(), author: user.email, timestamp: Date.now() };
    const updated = [...comments, newComment];
    setComments(updated);
    onUpdate(card.id, { comments: updated });
    logActivity(`commented on "${card.text}"`);
    setComment("");
  }

  function toggleLabel(lid) {
    setLabels(prev => prev.includes(lid) ? prev.filter(l => l !== lid) : [...prev, lid]);
  }

  const TABS = isTeamLead ? ["details", "comments", "labels"] : ["details", "comments"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif" }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 16, width: 640, maxHeight: "85vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)", animation: "popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: "24px 32px 0", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              readOnly={!isTeamLead}
              style={{ flex: 1, fontSize: 20, fontWeight: 800, color: "#0f172a", border: "none", outline: "none", fontFamily: "inherit", background: "transparent", letterSpacing: "-0.3px" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              {isTeamLead && (
  <button onClick={() => { if (window.confirm("Delete this card?")) { onDelete(card.id); onClose(); } }}
    style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", fontSize: 16, color: "#b91c1c", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}
    onMouseEnter={e => e.currentTarget.style.background = "#fca5a5"}
    onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}>
    🗑
  </button>
)}
              <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 18, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}>✕</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                color: tab === t ? ACCENT : "#64748b",
                borderBottom: `3px solid ${tab === t ? ACCENT : "transparent"}`,
                textTransform: "capitalize", transition: "0.2s",
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {tab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Description</label>
                <textarea
  value={desc}
  onChange={e => isTeamLead && setDesc(e.target.value)}
  disabled={!isTeamLead}
  placeholder="Add a more detailed description..."
  rows={4}
  style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", background: isTeamLead ? "white" : "#f8fafc", cursor: isTeamLead ? "text" : "not-allowed" }}
  onFocus={e => isTeamLead && (e.target.style.borderColor = ACCENT)}
  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
/>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Priority</label>
                 <select value={priority} onChange={e => isTeamLead && setPriority(e.target.value)}
  disabled={!isTeamLead}
  style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", background: isTeamLead ? "white" : "#f8fafc", cursor: isTeamLead ? "pointer" : "not-allowed" }}>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label} {k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Due Date</label>
                 <input type ="date" value={dueDate} onChange={e => isTeamLead && setDueDate(e.target.value)}
  disabled={!isTeamLead}
  style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", background: isTeamLead ? "white" : "#f8fafc", cursor: isTeamLead ? "pointer" : "not-allowed" }}
                />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Assignee</label>
                {/* Dropdown showing member names instead of raw email input */}
                <select
  value={assignee}
  onChange={e => isTeamLead && setAssignee(e.target.value)}
  disabled={!isTeamLead}
  style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", background: isTeamLead ? "white" : "#f8fafc", cursor: isTeamLead ? "pointer" : "not-allowed", boxSizing: "border-box" }}
  onFocus={e => isTeamLead && (e.target.style.borderColor = ACCENT)}
  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
>
                  <option value="">— Unassigned —</option>
                  {members.map(m => (
                    <option key={m.email} value={m.email}>{m.name}</option>
                  ))}
                </select>
                {assignee && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                    📧 {assignee}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "comments" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                  {(user?.email || "U")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    placeholder="Write a comment… (Enter to submit)"
                    rows={2}
                    style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                  <button onClick={handleAddComment} disabled={!comment.trim()} style={{
                    marginTop: 8, padding: "8px 20px", background: comment.trim() ? ACCENT : "#e2e8f0",
                    color: comment.trim() ? "white" : "#94a3b8", border: "none", borderRadius: 8,
                    cursor: comment.trim() ? "pointer" : "default", fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "0.2s"
                  }}>Post</button>
                </div>
              </div>

              {comments.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "24px 0" }}>No comments yet — be the first!</div>
              ) : (
                comments.slice().reverse().map((c, i) => (
                  <div key={c.id || i} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
                      {(c.author || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{getDisplayName(c.author)}</span>
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{timeAgo(c.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.5 }}>{c.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "labels" && (
            <div>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>Click to toggle labels on this card</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {LABEL_COLORS.map(lc => {
                  const active = labels.includes(lc.id);
                  return (
                    <button key={lc.id} onClick={() => toggleLabel(lc.id)} style={{
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "12px 16px", border: `2px solid ${active ? lc.dot : "#e2e8f0"}`,
                      borderRadius: 10, background: active ? lc.bg : "white",
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", textAlign: "left",
                    }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: lc.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: active ? lc.text : "#334155", flex: 1 }}>{lc.name}</span>
                      {active && <span style={{ fontSize: 18, color: lc.dot }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 32px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          {assignEmailStatus === "sending" && <span style={{ fontSize: 13, color: "#64748b" }}>📧 Sending assignment email...</span>}
          {assignEmailStatus === "sent" && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✅ Assignment email sent!</span>}
          {assignEmailStatus === "failed" && <span style={{ fontSize: 13, color: "#b91c1c" }}>⚠️ Email failed (backend may be offline)</span>}
          {!assignEmailStatus && <div />}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{ padding: "10px 24px", background: "white", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", transition: "0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}>Cancel</button>
            {isTeamLead && (
  <button onClick={handleSave} style={{ padding: "10px 28px", background: ACCENT, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", boxShadow: "0 4px 12px rgba(13,148,136,0.2)" }}>Save Changes</button>
)}
          </div>
        </div>
      </div>
    </div>
  );
}