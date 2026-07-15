import React from "react";
import { getBoardGradient, formatDate, getDeadlineBadge, getInitials, getAvatarColor } from "../../utils/boardHelpers";

function DeleteBoardButton({ onDelete }) {
  return (
    <button
      onClick={onDelete}
      aria-label="Delete board"
      title="Delete board"
      style={{
        position: "absolute", top: 12, right: 12,
        background: "rgba(239,68,68,0.18)",
        border: "1px solid rgba(239,68,68,0.4)",
        borderRadius: 6, color: "white", padding: "6px 8px",
        cursor: "pointer", zIndex: 10, fontSize: 15,
        backdropFilter: "blur(4px)",
        transition: "background 0.2s, box-shadow 0.2s, transform 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "rgba(220,38,38,0.95)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.25)";
        e.currentTarget.style.transform = "scale(1.06)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(239,68,68,0.18)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >🗑️</button>
  );
}

function hasCustomPhoto(photoURL) {
  return Boolean(photoURL) && photoURL.trim() !== "" && !photoURL.includes("Profile_avatar_placeholder");
}

function MemberAvatar({ identifier, offset, profile }) {
  const photoURL = profile?.photoURL;

  if (hasCustomPhoto(photoURL)) {
    return (
      <img
        src={photoURL}
        alt={profile?.name || identifier}
        title={profile?.name || identifier}
        className="member-avatar"
        style={{
          marginLeft: offset > 0 ? "-6px" : 0,
          objectFit: "cover",
          border: "2px solid #ffffff",
        }}
      />
    );
  }

  return (
    <div
      className="member-avatar"
      title={profile?.name || identifier}
      style={{
        marginLeft: offset > 0 ? "-6px" : 0,
        backgroundColor: getAvatarColor(identifier),
        color: "#ffffff",
        border: "2px solid #ffffff",
      }}
    >
      {getInitials(profile?.name || identifier)}
    </div>
  );
}

function BoardCardFooter({ members, userEmail, memberProfiles }) {
  const memberList = members || [userEmail];
  return (
    <div className="board-card-footer">
      <div style={{ display: "flex", alignItems: "center" }}>
        {memberList.slice(0, 3).map((m, idx) => (
          <MemberAvatar key={idx} identifier={m} offset={idx} profile={memberProfiles?.[m]} />
        ))}
        <span className="member-count">{memberList.length} member{memberList.length !== 1 ? "s" : ""}</span>
      </div>
      <span className="open-pill">Open <span className="open-arrow">→</span></span>
    </div>
  );
}

export default function BoardCard({ board, index, isTeamLead, userEmail, onSelect, onDelete, memberProfiles }) {
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
      <BoardCardFooter members={board.members} userEmail={userEmail} memberProfiles={memberProfiles} />
    </div>
  );
}