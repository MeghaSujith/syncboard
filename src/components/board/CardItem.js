import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { ACCENT, LABEL_COLORS, PRIORITY_CONFIG, getInitials, getPriority } from "../../utils/boardHelpers";

function formatShortDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return d; }
}

function CardLabels({ labels }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {labels.map(lid => {
        const lc = LABEL_COLORS.find(l => l.id === lid);
        if (!lc) return null;
        return (
          <span key={lid} style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: lc.bg, color: lc.text, letterSpacing: "0.3px",
          }}>
            {lc.name}
          </span>
        );
      })}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const pc = PRIORITY_CONFIG[priority];
  return (
    <div title={`Priority: ${pc.label}`} style={{
      display: "flex", alignItems: "center", gap: 4,
      color: pc.text, fontSize: 11, fontWeight: 700, letterSpacing: "0.3px",
      flexShrink: 0
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: pc.color }} />
      {pc.label}
    </div>
  );
}

function AssigneeInfo({ assignee, assigneeName, assigneePhoto, hasAssigneePhoto }) {
  if (!assignee) return <div />;
  return (
    <>
      {hasAssigneePhoto ? (
        <img
          src={assigneePhoto} alt={assigneeName}
          style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid #e2e8f0" }}
        />
      ) : (
        <div style={{
          width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#0ea5e9)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800,
          color: "white", flexShrink: 0, border: "1px solid white", boxShadow: "0 0 0 1px #e2e8f0",
        }}>
          {getInitials(assigneeName)}
        </div>
      )}
      <span style={{ fontSize: 12, color: "#475569", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>
        {assigneeName}
      </span>
    </>
  );
}

function DueDateBadge({ dueDate, isDone, isOverdue }) {
  if (!dueDate) return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
      background: isDone ? "#dcfce7" : isOverdue ? "#fee2e2" : "#f8fafc",
      color: isDone ? "#15803d" : isOverdue ? "#b91c1c" : "#64748b",
      display: "flex", alignItems: "center", gap: 3,
      border: `1px solid ${isDone ? "#bbf7d0" : isOverdue ? "#fecaca" : "#e2e8f0"}`,
    }}>
      {isDone ? "✓" : isOverdue ? "!" : ""}
      {formatShortDate(dueDate)}
    </span>
  );
}

function CommentBadge({ count }) {
  if (count <= 0) return null;
  return (
    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      {count}
    </span>
  );
}

function CardFooter({ card, colId, memberProfiles }) {
  const isDone = colId === "done";
  const isOverdue = !isDone && card.dueDate && new Date(card.dueDate) < new Date();
  const profile = memberProfiles[card.assignee];
  const assigneeName = profile?.name || (card.assignee ? card.assignee.split("@")[0] : "");
  const assigneePhoto = profile?.photo;
  const hasAssigneePhoto = assigneePhoto && !assigneePhoto.includes("Profile_avatar_placeholder");
  const commentCount = (card.comments || []).length;

  if (!card.assignee && !card.dueDate && commentCount === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 12px", borderTop: "1px solid #f1f5f9", marginTop: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <AssigneeInfo assignee={card.assignee} assigneeName={assigneeName} assigneePhoto={assigneePhoto} hasAssigneePhoto={hasAssigneePhoto} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <DueDateBadge dueDate={card.dueDate} isDone={isDone} isOverdue={isOverdue} />
        <CommentBadge count={commentCount} />
      </div>
    </div>
  );
}

function DeleteButton({ onDelete, cardId }) {
  return (
    <div style={{ position: "absolute", top: 10, right: 10 }} onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); if (window.confirm("Delete this card?")) onDelete(cardId); }}
        style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "rgba(241,245,249,0.95)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", transition: "0.15s", backdropFilter: "blur(4px)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#b91c1c"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(241,245,249,0.95)"; e.currentTarget.style.color = "#94a3b8"; }}
        title="Delete"
      >✕</button>
    </div>
  );
}

function getCardStyle(snapshot, hovered, draggableStyle) {
  return {
    userSelect: "none", borderRadius: 10, marginBottom: 12, background: "white",
    border: `1px solid ${snapshot.isDragging ? ACCENT : hovered ? "#cbd5e1" : "#ffffff"}`,
    boxShadow: snapshot.isDragging ? "0 20px 40px -8px rgba(0,0,0,0.18), 0 0 0 1px rgba(13,148,136,0.3)" : hovered ? "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    cursor: snapshot.isDragging ? "grabbing" : "pointer",
    transition: snapshot.isDragging ? "none" : "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
    transform: hovered && !snapshot.isDragging ? "translateY(-1px)" : "none",
    ...(snapshot.isDragging ? { zIndex: 9999, position: "relative" } : {}),
    ...draggableStyle, overflow: "hidden",
  };
}

export default function CardItem({ card, onDelete, onEdit, onOpen, index, colColor, colId, memberProfiles = {} }) {
  const [hovered, setHovered] = useState(false);
  const priority = getPriority(card);
  const labels = card.labels || [];

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => onOpen(card)} style={getCardStyle(snapshot, hovered, provided.draggableProps.style)}>
          <div style={{ padding: "14px 16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <CardLabels labels={labels} />
              <PriorityBadge priority={priority} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.55, marginBottom: 14, paddingRight: hovered ? 28 : 0, transition: "padding-right 0.15s" }}>
              {card.text}
            </div>
          </div>
          <CardFooter card={card} colId={colId} memberProfiles={memberProfiles} />
          {hovered && <DeleteButton onDelete={onDelete} cardId={card.id} />}
        </div>
      )}
    </Draggable>
  );
}