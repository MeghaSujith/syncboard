import React, { useState } from "react";
import { timeAgo } from "../../utils/boardHelpers";

function NotificationItem({ notification }) {
  return (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: notification.read ? "white" : "#f0fdfa", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}>
      <div style={{ fontSize: 15, color: "#334155", lineHeight: 1.5 }}>{notification.message}</div>
      <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, fontWeight: 500 }}>{timeAgo(notification.timestamp)}</div>
    </div>
  );
}

function NotificationPanel({ notifications, onClear }) {
  return (
    <div style={{ position: "absolute", right: 0, top: 50, width: 340, background: "white", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", zIndex: 500, fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden", animation: "popIn 0.2s ease" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Notifications</span>
        {notifications.length > 0 && <button onClick={onClear} style={{ fontSize: 14, fontWeight: 600, color: "#0ea5e9", background: "none", border: "none", cursor: "pointer" }}>Clear all</button>}
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "#94a3b8", fontSize: 15 }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>📭</div>No notifications
          </div>
        ) : (
          notifications.slice().reverse().map((n, i) => <NotificationItem key={i} notification={n} />)
        )}
      </div>
    </div>
  );
}

export default function NotificationBell({ notifications, onClear }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: "relative" }}>
      <button
        title="Notifications"
        onClick={() => setOpen(o => !o)}
        style={{ width: 40, height: 40, borderRadius: "8px", border: "1px solid #334155", background: open ? "#1e293b" : "transparent", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}
        onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
        onMouseLeave={e => e.currentTarget.style.background = open ? "#1e293b" : "transparent"}
      >
        <span style={{color: "#cbd5e1"}}>🔔</span>
        {unread > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", border: "2px solid #0f172a", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread}
          </span>
        )}
      </button>
      {open && <NotificationPanel notifications={notifications} onClear={onClear} />}
    </div>
  );
}