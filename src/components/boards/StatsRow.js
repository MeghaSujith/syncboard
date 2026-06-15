import React, { useState } from "react";

function StatPopover({ type, boards, userEmail, onClose }) {
  if (type === "boards") {
    return (
      <div style={{
        position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
        background: "white", borderRadius: 12, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.2)",
        padding: "12px", minWidth: 200, zIndex: 100, border: "1px solid #e2e8f0"
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e2e8f0" }}>
          Your Boards ({boards.length})
        </div>
        {boards.slice(0, 5).map(b => (
          <div key={b.id} style={{ padding: "6px 0", fontSize: 13, color: "#334155" }}>{b.name}</div>
        ))}
        {boards.length > 5 && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>+{boards.length - 5} more</div>}
      </div>
    );
  }

  if (type === "pending") {
    const pendingTasks = [];
    boards.forEach(b => {
      const doneIds = b.data?.columns?.done?.cardIds || [];
      const cards = b.data?.cards || {};
      Object.values(cards).forEach(c => {
        if (c.assignee === userEmail && !doneIds.includes(c.id)) {
          pendingTasks.push({ boardName: b.name, text: c.text });
        }
      });
    });
    return (
      <div style={{
        position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
        background: "white", borderRadius: 12, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.2)",
        padding: "12px", minWidth: 220, zIndex: 100, border: "1px solid #e2e8f0"
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e2e8f0" }}>
          Pending Tasks ({pendingTasks.length})
        </div>
        {pendingTasks.slice(0, 5).map((t, i) => (
          <div key={i} style={{ padding: "6px 0", fontSize: 13, color: "#334155" }}>
            <span style={{ fontWeight: 500 }}>{t.text}</span>
            <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>{t.boardName}</span>
          </div>
        ))}
        {pendingTasks.length === 0 && <div style={{ fontSize: 13, color: "#94a3b8" }}>No pending tasks</div>}
      </div>
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
        if (dueTime < now || (dueTime - now) < 172800000) {
          urgentTasks.push({ boardName: b.name, text: c.text, dueDate: c.dueDate });
        }
      });
    });
    return (
      <div style={{
        position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
        background: "white", borderRadius: 12, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.2)",
        padding: "12px", minWidth: 220, zIndex: 100, border: "1px solid #e2e8f0"
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e2e8f0" }}>
          Urgent Tasks ({urgentTasks.length})
        </div>
        {urgentTasks.slice(0, 5).map((t, i) => (
          <div key={i} style={{ padding: "6px 0", fontSize: 13, color: "#334155" }}>
            <span style={{ fontWeight: 500 }}>{t.text}</span>
            <span style={{ fontSize: 11, color: "#ef4444", display: "block" }}>
              Due: {new Date(t.dueDate).toLocaleDateString()}
            </span>
          </div>
        ))}
        {urgentTasks.length === 0 && <div style={{ fontSize: 13, color: "#94a3b8" }}>No urgent tasks</div>}
      </div>
    );
  }

  return null;
}

export default function StatsRow({ boards, myPendingCount, urgentTaskCount, hoveredStat, onStatEnter, onStatLeave, userEmail }) {
  const [hoverLocal, setHoverLocal] = useState(null);

  const handleMouseEnter = (statName) => {
    setHoverLocal(statName);
    if (onStatEnter) onStatEnter(statName);
  };

  const handleMouseLeave = () => {
    setHoverLocal(null);
    if (onStatLeave) onStatLeave();
  };

  const showPopover = hoveredStat !== undefined ? hoveredStat : hoverLocal;

  return (
    <div className="stats-row" style={{ display: "flex", gap: 16, marginBottom: 28 }}>
      {/* Total Boards Card */}
      <div 
        className="stat-card" 
        style={{ flex: 1, background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e2e8f0", position: "relative", cursor: "pointer" }}
        onMouseEnter={() => handleMouseEnter("boards")}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📋</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Boards</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{boards.length}</div>
          </div>
        </div>
        {showPopover === "boards" && <StatPopover type="boards" boards={boards} userEmail={userEmail} />}
      </div>

      {/* Pending Tasks Card */}
      <div 
        className="stat-card" 
        style={{ flex: 1, background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e2e8f0", position: "relative", cursor: "pointer" }}
        onMouseEnter={() => handleMouseEnter("pending")}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📝</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>My Pending</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{myPendingCount}</div>
          </div>
        </div>
        {showPopover === "pending" && <StatPopover type="pending" boards={boards} userEmail={userEmail} />}
      </div>

      {/* Urgent Tasks Card */}
      <div 
        className="stat-card" 
        style={{ flex: 1, background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e2e8f0", position: "relative", cursor: "pointer" }}
        onMouseEnter={() => handleMouseEnter("urgent")}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⏰</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Urgent & Overdue</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{urgentTaskCount}</div>
          </div>
        </div>
        {showPopover === "urgent" && <StatPopover type="urgent" boards={boards} userEmail={userEmail} />}
      </div>
    </div>
  );
}