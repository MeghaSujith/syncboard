import React, { useState } from "react";
import NotificationBell from "./NotificationBell";

export default function SidebarDock({
  showChat, setShowChat,
  showActivity, setShowActivity,
  setShowAnalytics,
  setShowSettings,
  notifications, onClearNotifications
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const dockItems = [
    { id: "analytics", title: "Analytics", icon: "📊", onClick: () => setShowAnalytics(true) },
    { id: "chat", title: "Team Chat", icon: "💬", active: showChat, onClick: () => { setShowChat(s => !s); setShowActivity(false); } },
    { id: "activity", title: "Activity Log", icon: "📋", active: showActivity, onClick: () => { setShowActivity(s => !s); setShowChat(false); } },
    { id: "settings", title: "Board Settings", icon: "⚙️", onClick: () => setShowSettings(true) },
  ];

  return (
    <div style={{
      position: "fixed",
      right: 12, // 👈 Pinned closer to the absolute edge
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      background: "#0f172a", // Match dark navigation tone
      border: "1px solid #1e293b", // Crisp subtle border
      padding: "10px 6px",
      borderRadius: 16,
      boxShadow: "0 10px 25px -3px rgba(15, 23, 42, 0.25)",
      zIndex: 90,
    }}>
      {dockItems.map((item, idx) => {
        const isHovered = hoveredIndex === idx;
        const isActive = item.active;

        return (
          <button
            key={item.id}
            title={item.title}
            onClick={item.onClick}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              width: 38,
              height: 38,
              background: isActive ? "#0d9488" : isHovered ? "#334155" : "#1e293b", // Matches navbar button tones
              color: isActive ? "white" : "#e2e8f0",
              border: isActive ? "none" : "1px solid #334155",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.18s ease",
            }}
          >
            {item.icon}
          </button>
        );
      })}

      <div 
        onMouseEnter={() => setHoveredIndex("bell")} 
        onMouseLeave={() => setHoveredIndex(null)}
        style={{
          width: 38,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: hoveredIndex === "bell" ? "#334155" : "#1e293b",
          border: "1px solid #334155",
          borderRadius: 8,
          transition: "all 0.18s ease",
          cursor: "pointer"
        }}
      >
        <NotificationBell notifications={notifications} onClear={onClearNotifications} />
      </div>
    </div>
  );
}