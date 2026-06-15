import React, { useState, useEffect, useRef } from "react";

export default function AddCardForm({ columnId, onAdd, colTheme }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  function handleAdd() {
    if (!text.trim()) return;
    onAdd(columnId, text.trim());
    setText("");
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
    if (e.key === "Escape") setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ width: "100%", padding: "10px 12px", marginTop: 8, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#64748b", fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        onMouseEnter={e => { e.target.style.borderColor = colTheme; e.target.style.color = colTheme; e.target.style.background = "white"; }}
        onMouseLeave={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.color = "#64748b"; e.target.style.background = "#f8fafc"; }}
      >
        + Add card
      </button>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <textarea
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter card title..."
        rows={2}
        style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${colTheme}`, outline: "none", resize: "none", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", boxShadow: `0 0 0 3px ${colTheme}20`, background: "white" }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={handleAdd} style={{ flex: 1, padding: "10px 0", background: colTheme, color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>Add Card</button>
        <button onClick={() => setOpen(false)} style={{ padding: "10px 16px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: "inherit", fontWeight: 500 }}>Cancel</button>
      </div>
    </div>
  );
}