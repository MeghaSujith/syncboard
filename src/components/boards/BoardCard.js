import React from "react";
import { getBoardGradient, formatDate, getDeadlineBadge, getInitials } from "../../utils/boardHelpers";
function DeleteBoardButton({ onDelete }) {
  return (
    <button
      onClick={onDelete}
      style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 6, color: "white", padding: "6px 8px", cursor: "pointer", zIndex: 10, fontSize: 14, backdropFilter: "blur(4px)", transition: "0.2s" }}
      title="Delete Board"
      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.9)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.3)"}
    >🗑️</button>
  );
}

function BoardCardFooter({ members, userEmail }) {
  const memberList = members || [userEmail];
  return (
    <div className="board-card-footer">
      <div style={{ display: "flex", alignItems: "center" }}>
        {memberList.slice(0, 3).map((m, idx) => (
          <div key={idx} className="member-avatar" style={{ marginLeft: idx > 0 ? "-6px" : 0 }}>{getInitials(m)}</div>
        ))}
        <span className="member-count">{memberList.length} member{memberList.length !== 1 ? "s" : ""}</span>
      </div>
      <span className="open-pill">Open <span className="open-arrow">→</span></span>
    </div>
  );
}

export default function BoardCard({ board, index, isTeamLead, userEmail, onSelect, onDelete }) {
  const gradient = getBoardGradient(board.id);
  const badgeStyle = getDeadlineBadge(board);

  return (
    <div className="board-card" style={{ animationDelay: `${index * 70}ms` }} onClick={() => onSelect(board.id)}>
      <div className="board-card-banner" style={{ background: gradient }}>
        {isTeamLead && <DeleteBoardButton onDelete={(e) => onDelete(e, board.id, board.name)} />}
        <div className="board-card-title-white">{board.name || "Unnamed Board"}</div>
        <span className="board-name-badge">Workspace</span>
      </div>
      <div className="board-card-body">
        <div className="board-card-meta">
          <span>🕐 {formatDate(board.createdAt)}</span>
          <span className="meta-dot" />
          <span>{board.owner === userEmail ? "Owned by you" : "Shared project"}</span>
        </div>
        <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: badgeStyle.bg, color: badgeStyle.text }}>
          {badgeStyle.icon} {badgeStyle.label}
        </div>
      </div>
      <BoardCardFooter members={board.members} userEmail={userEmail} />
    </div>
  );
}