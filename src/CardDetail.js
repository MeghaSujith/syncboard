import { useState } from "react";

function CardDetail({ card, onClose, onUpdate }) {
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(card.dueDate || "");
  const [assignee, setAssignee] = useState(card.assignee || "");

  function handleSave() {
    onUpdate(card.id, { description, dueDate, assignee });
    onClose();
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "350px",
      height: "100vh",
      background: "white",
      boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
      padding: "24px",
      zIndex: 1000,
      overflowY: "auto",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>{card.text}</h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#666", display: "block", marginBottom: "6px" }}>
          DESCRIPTION
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={4}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            boxSizing: "border-box",
            fontSize: "14px",
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#666", display: "block", marginBottom: "6px" }}>
          DUE DATE
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            boxSizing: "border-box",
            fontSize: "14px",
          }}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#666", display: "block", marginBottom: "6px" }}>
          ASSIGNEE
        </label>
        <input
          type="text"
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
          placeholder="Assign to..."
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            boxSizing: "border-box",
            fontSize: "14px",
          }}
        />
      </div>

      <button
        onClick={handleSave}
        style={{
          width: "100%",
          padding: "10px",
          background: "#0052cc",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "15px",
        }}
      >
        Save Changes
      </button>
    </div>
  );
}

export default CardDetail;

