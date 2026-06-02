import React from "react";

const COLUMN_COLORS = {
  todo:       { theme: "#8b5cf6" },
  inprogress: { theme: "#f59e0b" },
  review:     { theme: "#0ea5e9" },
  done:       { theme: "#10b981" },
};

const PRIORITY_CONFIG = {
  low:      { label: "Low",    color: "#22c55e", bg: "#dcfce7", text: "#166534" },
  medium:   { label: "Medium", color: "#f59e0b", bg: "#fef3c7", text: "#92400e" },
  high:     { label: "High",   color: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
  critical: { label: "🔥",     color: "#7c3aed", bg: "#ede9fe", text: "#5b21b6" },
};

export default function AnalyticsModal({ data, onClose }) {
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

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: 600, maxHeight: "85vh", overflowY: "auto", padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.1)", animation: "popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Board Analytics</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Overview of all cards and activity</div>
          </div>
          <button onClick={onClose} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
          {[ 
            { label: "Total Cards", value: total, icon: "📋", bg: "#f0fdfa", color: "#0d9488" }, 
            { label: "Completed", value: done, icon: "✅", bg: "#dcfce7", color: "#16a34a" }, 
            { label: "Overdue", value: overdue, icon: "⚠️", bg: "#fee2e2", color: "#b91c1c" } 
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "20px", textAlign: "center", border: `1px solid ${s.color}20` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#475569", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Completion Rate</span>
            <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>{total ? Math.round(done / total * 100) : 0}%</span>
          </div>
          <div style={{ height: 12, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${total ? done / total * 100 : 0}%`, background: "linear-gradient(90deg,#0d9488,#10b981)", borderRadius: 999, transition: "width 0.8s ease" }} />
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Cards by Column</div>
          {byCol.map(col => {
            const cc = COLUMN_COLORS[col.id] || { theme: "#94a3b8" };
            return (
              <div key={col.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: cc.theme, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 14, color: "#334155", fontWeight: 500 }}>{col.title}</div>
                <div style={{ width: `${total ? col.count / total * 200 : 0}px`, height: 8, background: `${cc.theme}60`, borderRadius: 999, transition: "width 0.6s ease" }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", minWidth: 28, textAlign: "right" }}>{col.count}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Priority Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {Object.entries(byPriority).map(([p, count]) => {
              const pc = PRIORITY_CONFIG[p];
              return (
                <div key={p} style={{ background: pc.bg, borderRadius: 10, padding: "16px 12px", textAlign: "center", border: `1px solid ${pc.text}20` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: pc.text }}>{count}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: pc.text, marginTop: 4, textTransform: "capitalize" }}>{p}</div>
                </div>
              );
            })}
          </div>
        </div>

        {Object.keys(assigneeCounts).length > 0 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Cards by Assignee</div>
            {Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]).map(([email, count]) => (
              <div key={email} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "8px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                  {email[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, fontSize: 14, color: "#334155", fontWeight: 500 }}>{email.split("@")[0]}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginRight: 8 }}>{count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}