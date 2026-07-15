import React from "react";
import BoardCard from "./BoardCard";

export default function BoardsGrid({ boards, searchQuery, isTeamLead, userEmail, onSelect, onDelete, memberProfiles }) {
  if (boards.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">🔍</div>
        <h3>No boards found</h3>
        <p>Try a different search term.</p>
      </div>
    );
  }
  return (
    <div className="boards-grid">
      {boards.map((board, i) => (
        <BoardCard
          key={board.id} board={board} index={i} isTeamLead={isTeamLead}
          userEmail={userEmail} onSelect={onSelect} onDelete={onDelete}
          memberProfiles={memberProfiles}
        />
      ))}
    </div>
  );
}