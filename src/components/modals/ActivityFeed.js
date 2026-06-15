import React from "react";
import { getInitials, timeAgo } from "../../utils/boardHelpers";

function ActivityAvatar({ name, photo }) {
  if (photo && !photo.includes("placeholder")) {
    return <img src={photo} alt={name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid #e2e8f0" }} />;
  }
  return (
    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0fdfa", border: "1px solid #ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#0d9488", flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

function ActivityMessage({ name, action, timestamp }) {
  return (
    <div style={{ flex: 1, paddingTop: 2 }}>
      <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
        <span style={{ fontWeight: 700, color: "#0f172a" }}>{name}</span> {action}
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontWeight: 600 }}>
        {timeAgo(timestamp)}
      </div>
    </div>
  );
}

function ActivityItem({ activity, profiles }) {
  const email = activity.user || "";
  const profile = profiles[email] || {};
  const name = profile.name || email.split("@")[0] || "Someone";
  
  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 16px", background: "white", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 12, transition: "0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#cbd5e1"} onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
      <ActivityAvatar name={name} photo={profile.photo} />
      <ActivityMessage name={name} action={activity.action} timestamp={activity.timestamp} />
    </div>
  );
}

function ActivityList({ activities, profiles }) {
  if (activities.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, paddingTop: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📋</div>
        No recent workspace activity
      </div>
    );
  }
  return activities.slice().reverse().map((a, i) => (
    <ActivityItem key={i} activity={a} profiles={profiles} />
  ));
}

export default function ActivityFeed({ activities, memberProfiles = {}, onClose }) {
  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 380, background: "#f8fafc", borderLeft: "1px solid #e2e8f0", zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-12px 0 40px rgba(0,0,0,0.08)", animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
      <div style={{ padding: "24px", background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Activity Log</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Recent workspace changes</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        <ActivityList activities={activities} profiles={memberProfiles} />
      </div>
    </div>
  );
}