import React, { useState, useEffect, useRef, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { db } from "./firebase";
import { ref, onValue, set, push } from "firebase/database";

import Presence from "./Presence";

// We ONLY import the external modals to prevent duplicate identifier errors
import AnalyticsModal from "./components/modals/AnalyticsModal"; 
import CardDetailModal from "./components/modals/CardDetailModal";
import ChatFeed from "./components/modals/ChatFeed";

// ─── Constants & Configurations ───────────────────────────────────────────────
const ACCENT = "#0d9488";

// Slate-100 columns separate nicely from the Slate-50 board background
const COLUMN_COLORS = {
  todo:       { theme: "#8b5cf6", bg: "#f1f5f9" },
  inprogress: { theme: "#f59e0b", bg: "#f1f5f9" },
  review:     { theme: "#0ea5e9", bg: "#f1f5f9" },
  done:       { theme: "#10b981", bg: "#f1f5f9" },
};

const defaultColumns = {
  todo:       { id: "todo",       title: "To Do",       cardIds: [] },
  inprogress: { id: "inprogress", title: "In Progress", cardIds: [] },
  review:     { id: "review",     title: "In Review",   cardIds: [] },
  done:       { id: "done",       title: "Done",        cardIds: [] },
};

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

function fixData(raw) {
  const fixed = { ...raw };
  if (fixed.columnOrder && !Array.isArray(fixed.columnOrder))
    fixed.columnOrder = Object.values(fixed.columnOrder);
  if (fixed.columns) {
    Object.keys(fixed.columns).forEach(colId => {
      const col = fixed.columns[colId];
      if (col.cardIds && !Array.isArray(col.cardIds)) col.cardIds = Object.values(col.cardIds);
      else if (!col.cardIds) col.cardIds = [];
    });
  }
  return fixed;
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function getPriority(card) {
  return card.priority || "medium";
}

// ─── Internal Components ──────────────────────────────────────────────────────

function CardItem({ card, onDelete, onEdit, onOpen, index, colColor, colId }) {
  const [hovered, setHovered] = useState(false);
  const priority = getPriority(card);
  const pc = PRIORITY_CONFIG[priority];
  const labels = card.labels || [];
  
  // ---> NEW FIXED DATE LOGIC <---
  const isDone = colId === "done";
  const isOverdue = !isDone && card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => onOpen(card)}
          style={{
            userSelect: "none", borderRadius: 8, marginBottom: 14,
            border: `1px solid ${snapshot.isDragging ? ACCENT : "rgba(15, 23, 42, 0.08)"}`,
            boxShadow: snapshot.isDragging
              ? "0 20px 25px -5px rgba(0, 0, 0, 0.15)"
              : hovered ? "0 10px 15px -3px rgba(0, 0, 0, 0.08)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            cursor: snapshot.isDragging ? "grabbing" : "grab",
            background: "white",
            transition: snapshot.isDragging ? "none" : "box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease",
            transform: hovered && !snapshot.isDragging ? "translateY(-2px)" : "none",
            ...(snapshot.isDragging ? { zIndex: 9999, position: 'relative' } : {}),
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: pc.color }} />
            <div style={{ padding: "16px 16px 16px 20px" }}>
              {labels.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {labels.map(lid => {
                    const lc = LABEL_COLORS.find(l => l.id === lid);
                    if (!lc) return null;
                    return (
                      <span key={lid} style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: lc.bg, color: lc.text }}>{lc.name}</span>
                    );
                  })}
                </div>
              )}
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", lineHeight: 1.5, marginBottom: 14, paddingRight: 24 }}>{card.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                
                {/* ---> UPDATED DUE DATE BADGE <--- */}
                {card.dueDate && (
                  <span style={{ 
                    fontSize: 13, fontWeight: 600, padding: "4px 8px", borderRadius: 6, 
                    background: isDone ? "#dcfce7" : isOverdue ? "#fee2e2" : "#f1f5f9", 
                    color: isDone ? "#15803d" : isOverdue ? "#b91c1c" : "#64748b", 
                    display: "flex", alignItems: "center", gap: 4 
                  }}>
                    {isDone ? "✅" : isOverdue ? "⚠️" : "📅"} {card.dueDate}
                  </span>
                )}

                {card.assignee && (
                  <span style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#0ea5e9)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white" }}>
                      {card.assignee[0].toUpperCase()}
                    </span>
                    {card.assignee.split("@")[0]}
                  </span>
                )}
                {(card.comments || []).length > 0 && (
                  <span style={{ fontSize: 13, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>💬 {card.comments.length}</span>
                )}
              </div>
            </div>
            {hovered && (
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button onClick={e => { e.stopPropagation(); if (window.confirm("Delete this card?")) onDelete(card.id); }} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "#fef2f2", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#b91c1c", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#fca5a5"} onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"} title="Delete">✕</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function AddCardForm({ columnId, onAdd, colTheme }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  function handleAdd() {
    if (!text.trim()) return;
    onAdd(columnId, text.trim());
    setText("");
    setOpen(false);
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width: "100%", padding: "10px 12px", marginTop: 8, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#64748b", fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onMouseEnter={e => { e.target.style.borderColor = colTheme; e.target.style.color = colTheme; e.target.style.background = "white"; }} onMouseLeave={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.color = "#64748b"; e.target.style.background = "#f8fafc"; }}>
      + Add card
    </button>
  );

  return (
    <div style={{ marginTop: 12 }}>
      <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } if (e.key === "Escape") setOpen(false); }} placeholder="Enter card title..." rows={2} style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${colTheme}`, outline: "none", resize: "none", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", boxShadow: `0 0 0 3px ${colTheme}20`, background: "white" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={handleAdd} style={{ flex: 1, padding: "10px 0", background: colTheme, color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>Add Card</button>
        <button onClick={() => setOpen(false)} style={{ padding: "10px 16px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: "inherit", fontWeight: 500 }}>Cancel</button>
      </div>
    </div>
  );
}

function FilterBar({ search, setSearch, filterLabel, setFilterLabel, filterAssignee, setFilterAssignee, filterPriority, setFilterPriority, allAssignees, onClear }) {
  const hasFilter = search || filterLabel || filterAssignee || filterPriority;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "16px 32px", background: "white", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ position: "relative", flex: "1 1 250px", minWidth: 200 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 15 }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards..." style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#f8fafc", transition: "0.2s" }} onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "white"; }} onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }} />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)} style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#f8fafc", color: filterLabel ? "#0f172a" : "#64748b", outline: "none", cursor: "pointer", transition: "0.2s" }} onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
          <option value="">All Labels</option>{LABEL_COLORS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#f8fafc", color: filterPriority ? "#0f172a" : "#64748b", outline: "none", cursor: "pointer", transition: "0.2s" }} onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
          <option value="">All Priorities</option>{Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label} {k}</option>)}
        </select>
        {allAssignees.length > 0 && (
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#f8fafc", color: filterAssignee ? "#0f172a" : "#64748b", outline: "none", cursor: "pointer", transition: "0.2s" }} onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
            <option value="">All Assignees</option>{allAssignees.map(a => <option key={a} value={a}>{a.split("@")[0]}</option>)}
          </select>
        )}
      </div>
      {hasFilter && <button onClick={onClear} style={{ padding: "10px 16px", background: "white", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "0.2s" }} onMouseEnter={e => e.target.style.background = "#fef2f2"} onMouseLeave={e => e.target.style.background = "white"}>Clear filters</button>}
    </div>
  );
}

function NotificationBell({ notifications, onClear }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;
  
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: 40, height: 40, borderRadius: "8px", border: "1px solid #334155", background: open ? "#1e293b" : "transparent", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#1e293b"} onMouseLeave={e => e.currentTarget.style.background = open ? "#1e293b" : "transparent"}>
        <span style={{color: "#cbd5e1"}}>🔔</span>
        {unread > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", border: "2px solid #0f172a", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: 50, width: 340, background: "white", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", zIndex: 500, fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden", animation: "popIn 0.2s ease" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Notifications</span>
            {notifications.length > 0 && <button onClick={onClear} style={{ fontSize: 14, fontWeight: 600, color: "#0ea5e9", background: "none", border: "none", cursor: "pointer" }}>Clear all</button>}
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {notifications.length === 0 ? ( <div style={{ padding: "32px 20px", textAlign: "center", color: "#94a3b8", fontSize: 15 }}><div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>📭</div>No notifications</div> ) : ( notifications.slice().reverse().map((n, i) => ( <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: n.read ? "white" : "#f0fdfa", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}><div style={{ fontSize: 15, color: "#334155", lineHeight: 1.5 }}>{n.message}</div><div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, fontWeight: 500 }}>{timeAgo(n.timestamp)}</div></div> )) )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityFeed({ activities, onClose }) {
  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 360, background: "white", borderLeft: "1px solid #e2e8f0", zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-10px 0 30px rgba(0,0,0,0.05)", animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Activity Log</div><div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Recent changes to this board</div></div>
        <button onClick={onClose} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {activities.length === 0 ? ( <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 15, paddingTop: 60 }}><div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📋</div>No activity yet</div> ) : ( activities.slice().reverse().map((a, i) => ( <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20 }}><div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#0d9488,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white" }}>{(a.user || "?")[0].toUpperCase()}</div><div style={{ flex: 1, paddingTop: 4 }}><div style={{ fontSize: 14, color: "#334155", lineHeight: 1.5 }}><span style={{ fontWeight: 600, color: "#0f172a" }}>{(a.user || "Someone").split("@")[0]}</span> {a.action}</div><div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{timeAgo(a.timestamp)}</div></div></div> )) )}
      </div>
    </div>
  );
}

function InviteModal({ boardInfo, boardId, onClose }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  function handleInvite() {
    if (!email.trim()) return;
    const currentMembers = boardInfo?.members || [];
    if (currentMembers.includes(email.trim())) { setMsg("Already a member!"); return; }
    set(ref(db, `boards/${boardId}/info/members`), [...currentMembers, email.trim()]);
    const userEmail = email.trim().replace(/\./g, ",");
    set(ref(db, `userBoards/${userEmail}/${boardId}`), true);
    setEmail("");
    setMsg("✅ Invited successfully!");
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: 460, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.1)", animation: "popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Invite to board</div>
        <div style={{ fontSize: 15, color: "#64748b", marginBottom: 24 }}>Members can view and edit all cards</div>
        <div style={{ display: "flex", gap: 12 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInvite()} placeholder="colleague@email.com" style={{ flex: 1, padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 15, fontFamily: "inherit", outline: "none", background: "#f8fafc" }} onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "white"; }} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
          <button onClick={handleInvite} style={{ padding: "0 24px", background: ACCENT, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "inherit" }}>Invite</button>
        </div>
        {msg && <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: msg.startsWith("✅") ? "#16a34a" : "#b91c1c" }}>{msg}</div>}
      </div>
    </div>
  );
}

// ─── Main Board Component ─────────────────────────────────────────────────────
function Board({ user, userRole, boardId, onLogout, onBack }) {
  
  // ---> DYNAMIC TEAM LEAD CHECK <---
  const isTeamLead = userRole === "team_lead";

  const [data, setData]               = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [boardInfo, setBoardInfo]     = useState(null);
  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [mounted, setMounted]         = useState(false);
  
  // ---> CHAT STATE <---
  const [showActivity, setShowActivity] = useState(false);
  const [showChat, setShowChat] = useState(false); 
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInvite, setShowInvite]   = useState(false);
  
  const [activities, setActivities]   = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch]           = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const boardRef = ref(db, `boards/${boardId}/data`);
    return onValue(boardRef, snap => {
      if (snap.exists()) setData(fixData(snap.val()));
      else set(boardRef, { columns: defaultColumns, cards: {}, columnOrder: ["todo", "inprogress", "review", "done"] });
    });
  }, [boardId]);

  useEffect(() => {
    return onValue(ref(db, `boards/${boardId}/info`), snap => {
      if (snap.exists()) setBoardInfo(snap.val());
    });
  }, [boardId]);

  useEffect(() => {
    return onValue(ref(db, `boards/${boardId}/activity`), snap => {
      if (snap.exists()) setActivities(Object.values(snap.val()));
    });
  }, [boardId]);

  useEffect(() => {
    const on = () => setIsOnline(true), off = () => setIsOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  function logActivity(action) {
    push(ref(db, `boards/${boardId}/activity`), { user: user.email, action, timestamp: Date.now() });
  }

  function addNotification(message) {
    setNotifications(prev => [...prev, { message, timestamp: Date.now(), read: false }]);
  }

  function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceCol = data.columns[source.droppableId];
    const destCol   = data.columns[destination.droppableId];
    const sourceIds = [...sourceCol.cardIds];
    const destIds   = sourceCol.id === destCol.id ? sourceIds : [...destCol.cardIds];

    sourceIds.splice(source.index, 1);
    destIds.splice(destination.index, 0, draggableId);

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [sourceCol.id]: { ...sourceCol, cardIds: sourceIds },
        [destCol.id]:   { ...destCol,   cardIds: destIds },
      },
    };
    set(ref(db, `boards/${boardId}/data`), newData);
    const cardText = data.cards[draggableId]?.text || "a card";
    if (source.droppableId !== destination.droppableId) {
      logActivity(`moved "${cardText}" from ${sourceCol.title} → ${destCol.title}`);
      addNotification(`Card "${cardText}" moved to ${destCol.title}`);
    }
  }

  function handleAddCard(columnId, text) {
    const id = "card-" + Date.now();
    const col = data.columns[columnId];
    const newData = {
      ...data,
      cards: { ...data.cards, [id]: { id, text, createdAt: Date.now(), createdBy: user.email, priority: "medium", labels: [], comments: [] } },
      columns: { ...data.columns, [columnId]: { ...col, cardIds: [...col.cardIds, id] } },
    };
    set(ref(db, `boards/${boardId}/data`), newData);
    logActivity(`added card "${text}" to ${col.title}`);
  }

  function handleDeleteCard(cardId) {
    const text = data.cards[cardId]?.text || "a card";
    const newCards = { ...data.cards };
    delete newCards[cardId];
    const newCols = {};
    Object.keys(data.columns).forEach(cId => {
      newCols[cId] = { ...data.columns[cId], cardIds: data.columns[cId].cardIds.filter(id => id !== cardId) };
    });
    set(ref(db, `boards/${boardId}/data`), { ...data, cards: newCards, columns: newCols });
    logActivity(`deleted card "${text}"`);
  }

  function handleEditCard(cardId, newText) {
    const newData = { ...data, cards: { ...data.cards, [cardId]: { ...data.cards[cardId], text: newText } } };
    set(ref(db, `boards/${boardId}/data`), newData);
    logActivity(`renamed card to "${newText}"`);
  }

  function handleUpdateCard(cardId, updates) {
    const oldCard = data.cards[cardId] || {};
    const newData = { ...data, cards: { ...data.cards, [cardId]: { ...oldCard, ...updates } } };
    set(ref(db, `boards/${boardId}/data`), newData);
  }

  function handleUpdateAndSync(cardId, updates) {
    handleUpdateCard(cardId, updates);
    setSelectedCard(prev => prev && prev.id === cardId ? { ...prev, ...updates } : prev);
  }

  const filteredCardIds = useCallback((cardIds) => {
    if (!search && !filterLabel && !filterAssignee && !filterPriority) return cardIds;
    return cardIds.filter(id => {
      const c = data?.cards?.[id];
      if (!c) return false;
      if (search && !c.text.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLabel && !(c.labels || []).includes(filterLabel)) return false;
      if (filterAssignee && c.assignee !== filterAssignee) return false;
      if (filterPriority && (c.priority || "medium") !== filterPriority) return false;
      return true;
    });
  }, [data, search, filterLabel, filterAssignee, filterPriority]);

  const allAssignees = data ? [...new Set(Object.values(data.cards || {}).map(c => c.assignee).filter(Boolean))] : [];
  const hasFilter = search || filterLabel || filterAssignee || filterPriority;

  if (!data || !data.columnOrder) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "4px solid #cbd5e1", borderTopColor: ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 16, color: "#64748b", fontWeight: 500 }}>Loading workspace...</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Plus Jakarta Sans', sans-serif; 
          background-color: #f8fafc; /* Slate 50 - Very clean board background */
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 24px 24px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .board-root { opacity: 0; transition: opacity 0.4s ease; }
        .board-root.mounted { opacity: 1; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; border: 2px solid #f8fafc; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className={`board-root${mounted ? " mounted" : ""}`} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {!isOnline && (
          <div style={{ background: "#ef4444", color: "white", padding: "10px 24px", textAlign: "center", fontSize: 15, fontWeight: 600 }}>
            ⚡ You're offline — changes will sync when reconnected
          </div>
        )}

        <nav style={{
          background: "#0f172a", 
          borderBottom: "1px solid #1e293b", 
          padding: "16px 32px", 
          minHeight: 72,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16,
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <button onClick={onBack} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", background: "#1e293b", border: "none",
              borderRadius: 8, cursor: "pointer", fontSize: 15, color: "#e2e8f0", fontFamily: "inherit", fontWeight: 600,
              transition: "0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#334155"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1e293b"; }}
            >
              ← My Boards
            </button>
            <div style={{ width: 1, height: 28, background: "#334155" }} />
            <div style={{ minWidth: "max-content" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.3px" }}>{boardInfo?.name || "Task 1"}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2, fontWeight: 500 }}>
                {Object.values(data.cards || {}).length} cards · {(boardInfo?.members || []).length} members
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, marginRight: 8, whiteSpace: "nowrap"}}>
               <span style={{fontSize: 13, color: '#94a3b8', fontWeight: 600}}>Active:</span>
               <Presence user={user} boardId={boardId} />
            </div>

            {isTeamLead && (
              <button onClick={() => alert("Opening Management Console: Fetching global board data...")} style={{
                padding: "8px 16px", background: "#4f46e5", color: "white", border: "none",
                borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6, transition: "0.2s", boxShadow: "0 4px 6px rgba(79, 70, 229, 0.3)"
              }} onMouseEnter={e => e.currentTarget.style.background = "#4338ca"} onMouseLeave={e => e.currentTarget.style.background = "#4f46e5"}>
                👑 Manager Console
              </button>
            )}

            <button onClick={() => setShowAnalytics(true)} style={{
              padding: "8px 16px", background: "#1e293b", color: "#e2e8f0", border: "none",
              borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6, transition: "0.2s"
            }} onMouseEnter={e => e.currentTarget.style.background = "#334155"} onMouseLeave={e => e.currentTarget.style.background = "#1e293b"}>
              📊 Analytics
            </button>

            {/* ---> NEW CHAT BUTTON <--- */}
            <button onClick={() => setShowChat(s => !s)} style={{
              padding: "8px 16px",
              background: showChat ? "#0d9488" : "#1e293b",
              color: showChat ? "white" : "#e2e8f0",
              border: "none",
              borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6, transition: "0.2s"
            }}>
              💬 Team Chat
            </button>

            <button onClick={() => setShowActivity(s => !s)} style={{
              padding: "8px 16px",
              background: showActivity ? "#0d9488" : "#1e293b",
              color: showActivity ? "white" : "#e2e8f0",
              border: "none",
              borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6, transition: "0.2s"
            }}>
              📋 Activity
            </button>

            <NotificationBell notifications={notifications} onClear={() => setNotifications([])} />

            <button onClick={() => setShowInvite(true)} style={{
              padding: "8px 16px", background: ACCENT, color: "white", border: "none",
              borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6, marginLeft: 8, boxShadow: "0 4px 6px rgba(13, 148, 136, 0.3)"
            }}>
              + Invite
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", marginLeft: 8, background: "#0ea5e9", borderRadius: 24, whiteSpace: "nowrap" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0ea5e9" }}>
                {user.email[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 14, color: "white", fontWeight: 600 }}>{user.email.split("@")[0]}</span>
            </div>

            <button onClick={onLogout} style={{
              padding: "8px 16px", background: "transparent", color: "#ef4444",
              border: "1px solid #7f1d1d", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              transition: "0.2s"
            }} onMouseEnter={e => {e.currentTarget.style.background = "#7f1d1d"; e.currentTarget.style.color = "white";}} onMouseLeave={e => {e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ef4444";}}>
              Sign out
            </button>
          </div>
        </nav>

        <FilterBar
          search={search} setSearch={setSearch}
          filterLabel={filterLabel} setFilterLabel={setFilterLabel}
          filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee}
          filterPriority={filterPriority} setFilterPriority={setFilterPriority}
          allAssignees={allAssignees}
          onClear={() => { setSearch(""); setFilterLabel(""); setFilterAssignee(""); setFilterPriority(""); }}
        />

        <div style={{ flex: 1, overflowX: "auto", padding: "40px 32px" }}>
          {hasFilter && (
            <div style={{ marginBottom: 20, fontSize: 15, color: "#64748b", fontWeight: 500 }}>
              Showing filtered results — <span style={{ color: ACCENT, fontWeight: 700 }}>
                {Object.values(data.columns).reduce((acc, col) => acc + filteredCardIds(col.cardIds).length, 0)}
              </span> cards match
            </div>
          )}
          
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", minWidth: "max-content" }}>
              {data.columnOrder.map((colId) => {
                const column = data.columns[colId];
                if (!column) return null;
                const cc = COLUMN_COLORS[colId] || { theme: "#94a3b8", bg: "#f1f5f9" };
                const visibleIds = filteredCardIds(column.cardIds);
                const cards = visibleIds.map(id => data.cards[id]).filter(Boolean);

                return (
                  <div key={colId} style={{
                    width: 320, flexShrink: 0,
                    background: cc.bg, 
                    borderRadius: 12,
                    borderTop: `4px solid ${cc.theme}`,
                    boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.05)", 
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    <div style={{
                      padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(15, 23, 42, 0.04)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: cc.theme }} />
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{column.title}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "white", color: "#64748b", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        {hasFilter ? `${cards.length}/${column.cardIds.length}` : column.cardIds.length}
                      </span>
                    </div>

                    <Droppable droppableId={colId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            padding: "16px",
                            minHeight: 150,
                            background: snapshot.isDraggingOver ? "rgba(15, 23, 42, 0.04)" : "transparent",
                            borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
                            transition: "0.2s"
                          }}
                        >
                          {cards.length === 0 && !snapshot.isDraggingOver && (
                            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "30px 0", userSelect: "none" }}>
                              Drop cards here
                            </div>
                          )}
                          {cards.map((card, index) => (
                            <CardItem
                              key={card.id}
                              card={card}
                              index={index}
                              colColor={cc}
                              colId={colId}
                              onDelete={handleDeleteCard}
                              onEdit={handleEditCard}
                              onOpen={setSelectedCard}
                            />
                          ))}
                          {provided.placeholder}
                          {!hasFilter && <AddCardForm columnId={colId} onAdd={handleAddCard} colTheme={cc.theme} />}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onUpdate={handleUpdateAndSync}
            onDelete={handleDeleteCard}
            user={user}
            logActivity={logActivity}
          />
        )}
        {showActivity && <ActivityFeed activities={activities} onClose={() => setShowActivity(false)} />}
        
        {/* ---> CHAT FEED COMPONENT PASSED USERROLE <--- */}
        {showChat && <ChatFeed boardId={boardId} user={user} userRole={userRole} onClose={() => setShowChat(false)} />} 
        
        {showAnalytics && <AnalyticsModal data={data} onClose={() => setShowAnalytics(false)} />}
        {showInvite && <InviteModal boardInfo={boardInfo} boardId={boardId} onClose={() => setShowInvite(false)} />}
      </div>
    </>
  );
}

export default Board;