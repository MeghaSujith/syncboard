import React, { useState } from "react";

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

export default function CardDetailModal({ card, onClose, onUpdate, onDelete, user, logActivity }) {
  const [title, setTitle]       = useState(card.text);
  const [desc, setDesc]         = useState(card.description || "");
  const [dueDate, setDueDate]   = useState(card.dueDate || "");
  const [assignee, setAssignee] = useState(card.assignee || "");
  const [priority, setPriority] = useState(card.priority || "medium");
  const [labels, setLabels]     = useState(card.labels || []);
  const [comment, setComment]   = useState("");
  const [comments, setComments] = useState(card.comments || []);
  const [tab, setTab]           = useState("details");

  function handleSave() {
    onUpdate(card.id, { text: title, description: desc, dueDate, assignee, priority, labels, comments });
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

  const TABS = ["details", "comments", "labels"];

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
              style={{ flex: 1, fontSize: 20, fontWeight: 800, color: "#0f172a", border: "none", outline: "none", fontFamily: "inherit", background: "transparent", letterSpacing: "-0.3px" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { if (window.confirm("Delete this card?")) { onDelete(card.id); onClose(); } }}
                style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", fontSize: 16, color: "#b91c1c", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background="#fca5a5"} onMouseLeave={e => e.currentTarget.style.background="#fef2f2"}>
                🗑
              </button>
              <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 18, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background="#f8fafc"}>✕</button>
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
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value)}
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", background: "white", cursor: "pointer" }}>
                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label} {k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                    </select>
                    </div>
                    <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Due Date</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", background: "white", boxSizing: "border-box" }}
                    />
                    </div>
                </div>

                <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Assignee</label>
                    <input value={assignee} onChange={e => setAssignee(e.target.value)}
                    placeholder="assignee@email.com"
                    style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                    />
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
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{(c.author || "").split("@")[0]}</span>
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

        <div style={{ padding: "16px 32px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12, background: "#f8fafc" }}>
          <button onClick={onClose} style={{ padding: "10px 24px", background: "white", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background="white"}>Cancel</button>
          <button onClick={handleSave} style={{ padding: "10px 28px", background: ACCENT, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", boxShadow: "0 4px 12px rgba(13,148,136,0.2)" }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}