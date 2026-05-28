import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";
import Board from "./Board";
import Boards from "./Boards";

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

  if (authLoading) return <p style={{ padding: "30px" }}>Loading...</p>;
  if (!user) return <Auth />;
  if (!selectedBoardId) return (
    <Boards
      user={user}
      onSelectBoard={setSelectedBoardId}
      onLogout={handleLogout}
    />
  );

  return (
    <Board
      user={user}
      boardId={selectedBoardId}
      onLogout={handleLogout}
      onBack={() => setSelectedBoardId(null)}
    />
  );
}

export default App;