import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { db } from "./firebase";
import { ref, onValue, set } from "firebase/database";
import CardDetail from "./CardDetail";
import Presence from "./Presence";

const defaultColumns = {
  todo: { id: "todo", title: "To Do", cardIds: [] },
  inprogress: { id: "inprogress", title: "In Progress", cardIds: [] },
  done: { id: "done", title: "Done", cardIds: [] },
};

function fixData(raw) {
  const fixed = { ...raw };
  if (fixed.columnOrder && !Array.isArray(fixed.columnOrder)) {
    fixed.columnOrder = Object.values(fixed.columnOrder);
  }
  if (fixed.columns) {
    Object.keys(fixed.columns).forEach(colId => {
      const col = fixed.columns[colId];
      if (col.cardIds && !Array.isArray(col.cardIds)) {
        col.cardIds = Object.values(col.cardIds);
      } else if (!col.cardIds) {
        col.cardIds = [];
      }
    });
  }
  return fixed;
}

function Card({ card, onDelete, onEdit, onOpen }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(card.text);

  function handleEdit() {
    if (text.trim() && text !== card.text) {
      onEdit(card.id, text.trim());
    }
    setEditing(false);
  }

  return (
    <div style={{
      background: "white", padding: "10px", marginBottom: "8px",
      borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", gap: "8px",
    }}>
      {editing ? (
        <input autoFocus value={text}
          onChange={e => setText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={e => e.key === "Enter" && handleEdit()}
          style={{ flex: 1, border: "1px solid #0052cc", borderRadius: "4px", padding: "4px", fontSize: "14px" }}
        />
      ) : (
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setEditing(true)}>
          <span style={{ fontSize: "14px" }} title="Click to edit">{card.text}</span>
          {card.dueDate && (
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>📅 {card.dueDate}</div>
          )}
          {card.assignee && (
            <div style={{ fontSize: "11px", color: "#0052cc", marginTop: "2px" }}>👤 {card.assignee}</div>
          )}
        </div>
      )}
      <button onClick={(e) => { e.stopPropagation(); onOpen(card); }}
        style={{ background: "none", border: "none", color: "#0052cc", cursor: "pointer", fontSize: "14px", padding: "0 4px", flexShrink: 0 }}
        title="View details">ⓘ</button>
      <button onClick={() => { if (window.confirm("Delete this card?")) onDelete(card.id); }}
        style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "16px", padding: "0 4px", flexShrink: 0 }}
        title="Delete card">✕</button>
    </div>
  );
}

function AddCardForm({ columnId, onAdd }) {
  const [text, setText] = useState("");
  function handleAdd() {
    if (!text.trim()) return;
    onAdd(columnId, text.trim());
    setText("");
  }
  return (
    <div style={{ marginTop: "8px" }}>
      <input value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleAdd()}
        placeholder="Add a card..."
        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box", fontSize: "14px" }}
      />
      <button onClick={handleAdd}
        style={{ marginTop: "6px", width: "100%", padding: "8px", background: "#0052cc", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
        + Add Card
      </button>
    </div>
  );
}

function Board({ user, boardId, onLogout, onBack }) {
  const [data, setData] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [boardInfo, setBoardInfo] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const boardRef = ref(db, `boards/${boardId}/data`);
    const unsubscribe = onValue(boardRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(fixData(snapshot.val()));
      } else {
        set(boardRef, {
          columns: defaultColumns,
          cards: {},
          columnOrder: ["todo", "inprogress", "done"],
        });
      }
    });
    return () => unsubscribe();
  }, [boardId]);

  useEffect(() => {
    const infoRef = ref(db, `boards/${boardId}/info`);
    const unsubscribe = onValue(infoRef, (snapshot) => {
      if (snapshot.exists()) setBoardInfo(snapshot.val());
    });
    return () => unsubscribe();
  }, [boardId]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    const membersRef = ref(db, `boards/${boardId}/info/members`);
    const currentMembers = boardInfo?.members || [];
    if (currentMembers.includes(inviteEmail.trim())) {
      setInviteMsg("User is already a member!");
      return;
    }
    set(membersRef, [...currentMembers, inviteEmail.trim()]);
    const userEmail = inviteEmail.trim().replace(/\./g, ",");
    set(ref(db, `userBoards/${userEmail}/${boardId}`), true);
    setInviteEmail("");
    setInviteMsg("Invited successfully!");
    setTimeout(() => setInviteMsg(""), 3000);
  }

  function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceCol = data.columns[source.droppableId];
    const destCol = data.columns[destination.droppableId];
    const sourceCardIds = [...sourceCol.cardIds];
    const destCardIds = sourceCol === destCol ? sourceCardIds : [...destCol.cardIds];

    sourceCardIds.splice(source.index, 1);
    destCardIds.splice(destination.index, 0, draggableId);

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [sourceCol.id]: { ...sourceCol, cardIds: sourceCardIds },
        [destCol.id]: { ...destCol, cardIds: destCardIds },
      },
    };
    set(ref(db, `boards/${boardId}/data`), newData);
  }

  function handleAddCard(columnId, text) {
    const newCardId = "card-" + Date.now();
    const column = data.columns[columnId];
    const newData = {
      ...data,
      cards: { ...data.cards, [newCardId]: { id: newCardId, text } },
      columns: {
        ...data.columns,
        [columnId]: { ...column, cardIds: [...column.cardIds, newCardId] },
      },
    };
    set(ref(db, `boards/${boardId}/data`), newData);
  }

  function handleDeleteCard(cardId) {
    const newCards = { ...data.cards };
    delete newCards[cardId];
    const newColumns = {};
    Object.keys(data.columns).forEach(colId => {
      newColumns[colId] = { ...data.columns[colId], cardIds: data.columns[colId].cardIds.filter(id => id !== cardId) };
    });
    set(ref(db, `boards/${boardId}/data`), { ...data, cards: newCards, columns: newColumns });
  }

  function handleEditCard(cardId, newText) {
    const newData = { ...data, cards: { ...data.cards, [cardId]: { ...data.cards[cardId], text: newText } } };
    set(ref(db, `boards/${boardId}/data`), newData);
  }

  function handleUpdateCard(cardId, updates) {
    const newData = { ...data, cards: { ...data.cards, [cardId]: { ...data.cards[cardId], ...updates } } };
    set(ref(db, `boards/${boardId}/data`), newData);
  }

  if (!data || !data.columnOrder) return <p style={{ padding: "30px" }}>Loading board...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {!isOnline && (
        <div style={{
          background: "#ff5630", color: "white", padding: "8px",
          textAlign: "center", fontSize: "14px", marginBottom: "12px",
          borderRadius: "6px"
        }}>
          You are offline — changes will sync when reconnected
        </div>
      )}
      {selectedCard && (
        <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} onUpdate={handleUpdateCard} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ margin: 0 }}>SyncBoard</h1>
          <button onClick={onBack}
            style={{ padding: "6px 12px", background: "none", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#666" }}>
            ← My Boards
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Presence user={user} boardId={boardId} />
          <button onClick={() => setShowInvite(!showInvite)}
            style={{ padding: "8px 16px", background: "#36b37e", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
            + Invite
          </button>
          <span style={{ fontSize: "14px", color: "#666" }}>👤 {user.email}</span>
          <button onClick={onLogout}
            style={{ padding: "8px 16px", background: "#ff5630", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
            Logout
          </button>
        </div>
      </div>

      {showInvite && (
        <div style={{ background: "#f0f2f5", padding: "12px", borderRadius: "8px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="Enter email to invite..."
            style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
          />
          <button onClick={handleInvite}
            style={{ padding: "8px 16px", background: "#0052cc", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
            Invite
          </button>
          {inviteMsg && <span style={{ fontSize: "13px", color: "#36b37e" }}>{inviteMsg}</span>}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }}>
          {data.columnOrder.map(colId => {
            const column = data.columns[colId];
            const cards = column.cardIds.map(id => data.cards[id]);
            return (
              <Droppable droppableId={column.id} key={column.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    style={{ background: "#f0f2f5", padding: "12px", borderRadius: "8px", width: "250px", minWidth: "250px", minHeight: "400px", flex: "0 0 250px" }}>
                    <h3 style={{ marginTop: 0 }}>{column.title}</h3>
                    {cards.length === 0 && (
                      <p style={{ textAlign: "center", color: "#aaa", fontSize: "13px", marginTop: "20px" }}>
                        No cards yet — add one!
                      </p>
                    )}
                    {cards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            style={{ ...provided.draggableProps.style }}>
                            <Card card={card} onDelete={handleDeleteCard} onEdit={handleEditCard} onOpen={setSelectedCard} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <AddCardForm columnId={colId} onAdd={handleAddCard} />
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

export default Board;