import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";
import Board from "./Board";
import Boards from "./Boards";

const transitionStyle = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .page-transition {
    animation: fadeSlideIn 0.4s ease both;
  }
`;

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) setSelectedBoardId(null);
    });
    return () => unsubscribe();
  }, []);

  function handleLogout() {
    signOut(auth);
    setSelectedBoardId(null);
  }

  if (authLoading) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", background: "#f8fafc"
    }}>
      <div style={{
        width: "36px", height: "36px", border: "3px solid #e2e8f0",
        borderTopColor: "#0d9488", borderRadius: "50%",
        animation: "spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const pageKey = !user ? "auth" : selectedBoardId ? `board-${selectedBoardId}` : "boards";

  return (
    <>
      <style>{transitionStyle}</style>
      <div key={pageKey} className="page-transition">
        {!user ? (
          <Auth />
        ) : !selectedBoardId ? (
          <Boards
            user={user}
            onSelectBoard={setSelectedBoardId}
            onLogout={handleLogout}
          />
        ) : (
          <Board
            user={user}
            boardId={selectedBoardId}
            onLogout={handleLogout}
            onBack={() => setSelectedBoardId(null)}
          />
        )}
      </div>
    </>
  );
}

export default App;