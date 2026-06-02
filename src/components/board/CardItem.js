import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";

const ACCENT = "#0d9488"; // Keeping your brand Teal

const LABEL_COLORS = [
  { id: "red",    bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444", name: "Bug"      },
  { id: "amber",  bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", name: "Feature"  },
  { id: "green",  bg: "#dcfce7", text: "#166534", dot: "#22c55e", name: "Improve"  },
  { id: "blue",   bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6", name: "Docs"     },
  { id: "purple", bg: "#ede9fe", text: "#5b21b6", dot: "#8b5cf6", name: "Design"   },
  { id: "pink",   bg: "#fce7f3", text: "#9d174d", dot: "#ec4899", name: "Research" },
];

const PRIORITY_CONFIG = {
  low:      { label: "Low",    color: "#22c55e", bg: "#dcfce7", text: "#166534" },
  medium:   { label: "Medium", color: "#f59e0b", bg: "#fef3c7", text: "#92400e" },
  high:     { label: "High",   color: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
  critical: { label: "🔥",     color: "#7c3aed", bg: "#ede9fe", text: "#5b21b6" },
};

function getPriority(card) {
  return card.priority || "medium";
}

function CardItem({ card, onDelete, onEdit, onOpen, index, colColor }) {
  const [hovered, setHovered] = useState(false);
  const priority = getPriority(card);
  const pc = PRIORITY_CONFIG[priority];
  const labels = card.labels || [];
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && !card.done;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => onOpen(card)}
          style={{
            userSelect: "none",
            borderRadius: 10,
            marginBottom: 14,
            border: snapshot.isDragging ? `2px solid ${ACCENT}` : "1px solid transparent",
            // Modern floating shadow
            boxShadow: snapshot.isDragging
              ? "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)"
              : hovered 
                ? "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)" 
                : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            cursor: snapshot.isDragging ? "grabbing" : "grab",
            background: "white",
            // Disable transition during drag to prevent visual lag
            transition: snapshot.isDragging ? "none" : "box-shadow 0.2s ease, transform 0.2s ease",
            transform: hovered && !snapshot.isDragging ? "translateY(-2px)" : "none",
            ...(snapshot.isDragging ? { zIndex: 9999, position: 'relative' } : {}),
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: pc.color }} />

            <div style={{ padding: "16px 16px 16px 20px" }}>
              {labels.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {labels.map(lid => {
                    const lc = LABEL_COLORS.find(l => l.id === lid);
                    if (!lc) return null;
                    return (
                      <span key={lid} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: lc.bg, color: lc.text }}>
                        {lc.name}
                      </span>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", lineHeight: 1.5, marginBottom: 14, paddingRight: 24 }}>
                {card.text}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {card.dueDate && (
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 6,
                    background: isOverdue ? "#fee2e2" : "#f1f5f9",
                    color: isOverdue ? "#b91c1c" : "#64748b",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {isOverdue ? "⚠️" : "📅"} {card.dueDate}
                  </span>
                )}
                {card.assignee && (
                  <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: "linear-gradient(135deg,#0d9488,#0ea5e9)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "white",
                    }}>
                      {card.assignee[0].toUpperCase()}
                    </span>
                    {card.assignee.split("@")[0]}
                  </span>
                )}
                {(card.comments || []).length > 0 && (
                  <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                    💬 {card.comments.length}
                  </span>
                )}
              </div>
            </div>

            {hovered && (
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}
                onClick={e => e.stopPropagation()}>
                <button
                  onClick={e => { e.stopPropagation(); if (window.confirm("Delete this card?")) onDelete(card.id); }}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "#fef2f2", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#b91c1c", transition: "0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fca5a5"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}
                  title="Delete">✕</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default CardItem;