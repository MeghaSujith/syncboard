import React, { useState } from "react";

function PopoverContainer({ children }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 14px)", left: "50%", transform: "translateX(-50%)",
      background: "white", borderRadius: 12, boxShadow: "0 12px 32px -4px rgba(15,23,42,0.15)",
      minWidth: 260, zIndex: 100, border: "1px solid #e2e8f0", overflow: "visible"
    }}>
      <div style={{
        position: "absolute", top: -6, left: "50%", marginLeft: -6, width: 12, height: 12,
        background: "white", borderTop: "1px solid #e2e8f0", borderLeft: "1px solid #e2e8f0",
        transform: "rotate(45deg)", borderTopLeftRadius: 2
      }} />
      <div style={{ position: "relative", zIndex: 2, background: "white", borderRadius: 12, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function BoardsContent({ boards }) {
  return (
    <>
      <div style={{ background: "#f8fafc", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Workspaces</div>
      </div>
      <div style={{ padding: "8px" }}>
        {boards.slice(0, 5).map(b => (
          <div key={b.id} style={{ padding: "8px 12px", fontSize: 13, color: "#0f172a", display: "flex", alignItems: "center", gap: 10, borderRadius: 6, transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0ea5e9" }} />
            <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
          </div>
        ))}
        {boards.length > 5 && <div style={{ padding: "8px 12px", fontSize: 12, color: "#64748b", fontWeight: 500 }}>+ {boards.length - 5} more boards</div>}
      </div>
    </>
  );
}

function PendingContent({ boards, userEmail }) {
  const tasks = [];
  boards.forEach(b => Object.values(b.data?.cards || {}).forEach(c => {
    if (c.assignee === userEmail && !(b.data?.columns?.done?.cardIds || []).includes(c.id)) tasks.push({ ...c, boardName: b.name });
  }));
  return (
    <>
      <div style={{ background: "#f8fafc", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Assigned to You</div>
      </div>
      <div style={{ padding: "8px" }}>
        {tasks.slice(0, 5).map((t, i) => (
          <div key={i} style={{ padding: "8px 12px", borderRadius: 6, transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.text}</div>
            <div style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 700, marginTop: 4 }}>{t.boardName}</div>
          </div>
        ))}
        {tasks.length === 0 && <div style={{ padding: "12px", fontSize: 13, color: "#64748b", textAlign: "center" }}>You're all caught up!</div>}
      </div>
    </>
  );
}

function UrgentContent({ boards }) {
  const tasks = [];
  const now = Date.now();
  boards.forEach(b => Object.values(b.data?.cards || {}).forEach(c => {
    if (c.dueDate && !(b.data?.columns?.done?.cardIds || []).includes(c.id) && (new Date(c.dueDate).getTime() - now) < 172800000) tasks.push({ ...c, boardName: b.name });
  }));
  return (
    <>
      <div style={{ background: "#fff1f2", padding: "12px 16px", borderBottom: "1px solid #ffe4e6" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#e11d48", textTransform: "uppercase", letterSpacing: "0.5px" }}>Requires Attention</div>
      </div>
      <div style={{ padding: "8px" }}>
        {tasks.slice(0, 5).map((t, i) => (
          <div key={i} style={{ padding: "8px 12px", borderRadius: 6, transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#fff1f2"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.text}</div>
            <div style={{ fontSize: 11, color: "#e11d48", fontWeight: 700, marginTop: 4 }}>Due: {new Date(t.dueDate).toLocaleDateString()}</div>
          </div>
        ))}
        {tasks.length === 0 && <div style={{ padding: "12px", fontSize: 13, color: "#64748b", textAlign: "center" }}>No urgent items!</div>}
      </div>
    </>
  );
}

function StatPopover({ type, boards, userEmail }) {
  return (
    <PopoverContainer>
      {type === "boards" && <BoardsContent boards={boards} />}
      {type === "pending" && <PendingContent boards={boards} userEmail={userEmail} />}
      {type === "urgent" && <UrgentContent boards={boards} />}
    </PopoverContainer>
  );
}

function StatCard({ icon, bg, title, value, onEnter, onLeave, showPopover, popoverType, boards, userEmail }) {
  return (
    <div 
      className="stat-card" 
      style={{ flex: 1, background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e2e8f0", position: "relative", zIndex: showPopover ? 110 : 1, cursor: "default", transition: "0.2s" }}
      onMouseEnter={onEnter} onMouseLeave={onLeave}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{value}</div>
        </div>
      </div>
      {showPopover && <StatPopover type={popoverType} boards={boards} userEmail={userEmail} />}
    </div>
  );
}

export default function StatsRow({ boards, myPendingCount, urgentTaskCount, hoveredStat, onStatEnter, onStatLeave, userEmail }) {
  const [hoverLocal, setHoverLocal] = useState(null);
  const enter = (name) => { setHoverLocal(name); if (onStatEnter) onStatEnter(name); };
  const leave = () => { setHoverLocal(null); if (onStatLeave) onStatLeave(); };
  const active = hoveredStat !== undefined ? hoveredStat : hoverLocal;

  return (
    <div className="stats-row" style={{ display: "flex", gap: 16, marginBottom: 28, position: "relative", zIndex: 100 }}>
      <StatCard 
        icon="📋" bg="#ccfbf1" title="Total Boards" value={boards.length} 
        onEnter={() => enter("boards")} onLeave={leave} showPopover={active === "boards"} popoverType="boards" boards={boards} userEmail={userEmail} 
      />
      <StatCard 
        icon="📝" bg="#dbeafe" title="My Pending" value={myPendingCount} 
        onEnter={() => enter("pending")} onLeave={leave} showPopover={active === "pending"} popoverType="pending" boards={boards} userEmail={userEmail} 
      />
      <StatCard 
        icon="⏰" bg="#fee2e2" title="Urgent & Overdue" value={urgentTaskCount} 
        onEnter={() => enter("urgent")} onLeave={leave} showPopover={active === "urgent"} popoverType="urgent" boards={boards} userEmail={userEmail} 
      />
    </div>
  );
}