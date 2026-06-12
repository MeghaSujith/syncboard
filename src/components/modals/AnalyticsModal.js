import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

const COLUMN_COLORS = {
  todo:       { theme: "#8b5cf6" },
  inprogress: { theme: "#f59e0b" },
  review:     { theme: "#0ea5e9" },
  done:       { theme: "#10b981" },
};

const PRIORITY_CONFIG = {
  low:      { label: "Low",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  medium:   { label: "Medium", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  high:     { label: "High",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  critical: { label: "🔥 Crit", color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
};

export default function AnalyticsModal({ data, onClose }) {
  const [profiles, setProfiles] = useState({});

  // Fetch user profiles to convert emails into real names and avatars
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(usersRef, (snap) => {
      if (snap.exists()) {
        const allUsers = Object.values(snap.val());
        const profMap = {};
        allUsers.forEach(u => { profMap[u.email] = u; });
        setProfiles(profMap);
      }
    });
    return () => unsub();
  }, []);

  if (!data) return null;

  const allCards = Object.values(data.cards || {});
  const total = allCards.length;
  const done = allCards.filter(c => data.columns?.done?.cardIds?.includes(c.id)).length;
  const overdue = allCards.filter(c => c.dueDate && new Date(c.dueDate) < new Date()).length;
  
  const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };
  allCards.forEach(c => { const p = c.priority || "medium"; byPriority[p] = (byPriority[p] || 0) + 1; });
  
  const byCol = Object.entries(data.columns || {}).map(([id, col]) => ({
    id, title: col.title, count: (col.cardIds || []).length,
  }));
  
  const assigneeCounts = {};
  allCards.forEach(c => { if (c.assignee) assigneeCounts[c.assignee] = (assigneeCounts[c.assignee] || 0) + 1; });

  const completionPercentage = total ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: 600, maxHeight: "85vh", overflowY: "auto", padding: "32px 40px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", animation: "popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Board Analytics</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4, fontWeight: 500 }}>Overview of project health and team workload</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #e2e8f0", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}>✕</button>
        </div>

        {/* Top Metrics Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 36 }}>
          {[ 
            { label: "Total Cards", value: total, icon: "📋" }, 
            { label: "Completed", value: done, icon: "✅" }, 
            { label: "Overdue", value: overdue, icon: "⚠️", isAlert: overdue > 0 } 
          ].map(s => (
            <div key={s.label} style={{ background: "#ffffff", borderRadius: 12, padding: "20px", border: `1px solid ${s.isAlert ? "#fca5a5" : "#e2e8f0"}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>{s.label}</span>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.isAlert ? "#dc2626" : "#0f172a" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Crisp Progress Bar */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Overall Progress</span>
            <span style={{ fontSize: 16, color: "#4f46e5", fontWeight: 800 }}>{completionPercentage}%</span>
          </div>
          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${completionPercentage}%`, background: "#4f46e5", borderRadius: 999, transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }} />
          </div>
        </div>

        {/* Column & Priority Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
          
          {/* Cards by Column */}
          <div>
            <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, color: "#94a3b8", marginBottom: 16 }}>By Column</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {byCol.map(col => {
                const cc = COLUMN_COLORS[col.id] || { theme: "#94a3b8" };
                return (
                  <div key={col.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cc.theme, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 14, color: "#334155", fontWeight: 500 }}>{col.title}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{col.count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div>
            <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, color: "#94a3b8", marginBottom: 16 }}>By Priority</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(byPriority).filter(([_, count]) => count > 0).map(([p, count]) => {
                const pc = PRIORITY_CONFIG[p];
                return (
                  <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: pc.bg, border: `1px solid ${pc.border}`, borderRadius: 6, padding: "6px 12px" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: pc.color }}>{pc.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: pc.color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Cards by Assignee (Now with Real Names & Photos) */}
        {Object.keys(assigneeCounts).length > 0 && (
          <div>
            <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, color: "#94a3b8", marginBottom: 16 }}>Team Workload</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]).map(([email, count]) => {
                
                // Fetch profile data
                const profile = profiles[email];
                const rawName = profile?.name || email.split("@")[0];
                const displayName = rawName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
                const hasPhoto = profile?.photoURL && !profile.photoURL.includes("Profile_avatar_placeholder");
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <div key={email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#ffffff", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    
                    {/* Avatar */}
                    {hasPhoto ? (
                      <img src={profile.photoURL} alt={displayName} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid #e2e8f0" }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#475569", border: "1px solid #e2e8f0", flexShrink: 0 }}>
                        {initial}
                      </div>
                    )}
                    
                    {/* Name */}
                    <div style={{ flex: 1, fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                      {displayName}
                    </div>
                    
                    {/* Task Count Badge */}
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 8px", fontSize: 13, fontWeight: 700, color: "#475569" }}>
                      {count} task{count !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}