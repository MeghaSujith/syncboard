import React from "react";

// Helper function to format timestamps
function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function ActivityFeed({ activities, onClose }) {
  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: 340,
      background: "white", borderLeft: "1px solid #e2e8f0", zIndex: 200,
      display: "flex", flexDirection: "column",
      boxShadow: "-10px 0 30px rgba(0,0,0,0.05)",
      animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Activity Log</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Recent changes to this board</div>
        </div>
        <button onClick={onClose} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {activities.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, paddingTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📋</div>
            No activity yet
          </div>
        ) : (
          activities.slice().reverse().map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#0d9488,#0ea5e9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "white",
              }}>
                {(a.user || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{(a.user || "Someone").split("@")[0]}</span>{" "}
                  {a.action}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{timeAgo(a.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;