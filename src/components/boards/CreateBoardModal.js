import React from "react";

export default function CreateBoardModal({ inputRef, newBoardName, setNewBoardName, newBoardDeadline, setNewBoardDeadline, creating, onCreate, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">📋</div>
          <div className="modal-title">Create New Board</div>
          <div className="modal-subtitle">Set up a new project workspace for your team.</div>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label className="modal-label">Board Name</label>
            <input
              ref={inputRef}
              className="modal-input"
              value={newBoardName}
              onChange={e => setNewBoardName(e.target.value)}
              placeholder="e.g. Q3 Product Roadmap"
            />
          </div>
          <div className="modal-field" style={{ marginBottom: 0 }}>
            <label className="modal-label">Deadline</label>
            <input
              type="date"
              className="modal-input"
              value={newBoardDeadline}
              onChange={e => setNewBoardDeadline(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="modal-submit"
            onClick={onCreate}
            disabled={creating || !newBoardName.trim() || !newBoardDeadline}
          >
            {creating ? "Creating…" : "Create Board"}
          </button>
        </div>
      </div>
    </div>
  );
}