import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, set } from "firebase/database";

function Boards({ user, onSelectBoard, onLogout }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const userEmail = user.email.replace(/\./g, ",");
    const userBoardsRef = ref(db, `userBoards/${userEmail}`);

    const unsubscribe = onValue(userBoardsRef, (snapshot) => {
      if (snapshot.exists()) {
        const boardIds = Object.keys(snapshot.val());
        const boardPromises = boardIds.map(boardId => {
          return new Promise(resolve => {
            const boardInfoRef = ref(db, `boards/${boardId}/info`);
            onValue(boardInfoRef, (infoSnap) => {
              if (infoSnap.exists()) {
                resolve({ id: boardId, ...infoSnap.val() });
              } else {
                resolve({ id: boardId, name: "Unnamed Board" });
              }
            }, { onlyOnce: true });
          });
        });
        Promise.all(boardPromises).then(boardList => {
          setBoards(boardList);
          setLoading(false);
        });
      } else {
        setBoards([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  function handleCreateBoard() {
    if (!newBoardName.trim()) return;
    setCreating(true);

    const newBoardId = user.uid + "_" + Date.now();
    const userEmail = user.email.replace(/\./g, ",");

    set(ref(db, `boards/${newBoardId}/info`), {
      name: newBoardName.trim(),
      owner: user.email,
      members: [user.email],
      createdAt: Date.now(),
    });

    set(ref(db, `userBoards/${userEmail}/${newBoardId}`), true);

    setNewBoardName("");
    setCreating(false);
  }

  if (loading) return <p style={{ padding: "30px" }}>Loading your boards...</p>;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header */}
      <div style={{
        background: "#0052cc", padding: "16px 30px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <h1 style={{ margin: 0, color: "white", fontSize: "22px" }}>SyncBoard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "white", fontSize: "14px" }}>👤 {user.email}</span>
          <button onClick={onLogout}
            style={{ padding: "8px 16px", background: "#ff5630", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ color: "#333", marginBottom: "24px" }}>My Boards</h2>

        {/* Create new board */}
        <div style={{
          background: "white", padding: "20px", borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "24px"
        }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: "#333" }}>Create New Board</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={newBoardName}
              onChange={e => setNewBoardName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateBoard()}
              placeholder="Enter board name..."
              style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
            />
            <button onClick={handleCreateBoard} disabled={creating}
              style={{ padding: "10px 20px", background: "#0052cc", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
              + Create
            </button>
          </div>
        </div>

        {/* Board list */}
        {boards.length === 0 ? (
          <div style={{ textAlign: "center", color: "#aaa", padding: "40px" }}>
            <p style={{ fontSize: "16px" }}>No boards yet — create one above!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
            {boards.map(board => (
              <div key={board.id}
                onClick={() => onSelectBoard(board.id)}
                style={{
                  background: "white", padding: "20px", borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)", cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  borderLeft: "4px solid #0052cc",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"}
              >
                <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#333" }}>
                  {board.name || "Unnamed Board"}
                </h3>
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#666" }}>
                  Owner: {board.owner === user.email ? "You" : board.owner}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                  {board.members ? `${board.members.length} member${board.members.length > 1 ? "s" : ""}` : "1 member"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Boards;