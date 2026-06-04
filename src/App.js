import { useState, useEffect } from "react";
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import Auth from "./Auth";
import Board from "./Board";
import Boards from "./Boards";

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    padding: 0;
    background-color: #f8fafc;
  }

  /* Cinematic Film Grain Overlay */
  body::after {
    content: "";
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
  }

  @keyframes premiumFadeIn {
    from { 
      opacity: 0; 
      transform: translateY(12px) scale(0.99); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }

  .page-transition {
    animation: premiumFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    will-change: transform, opacity;
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4); }
    50% { box-shadow: 0 0 0 12px rgba(13, 148, 136, 0); }
  }

  @keyframes iconFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
`;

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("member"); 
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  useEffect(() => {
    let roleUnsubscribe;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        const userRef = ref(db, `users/${firebaseUser.uid}`);
        roleUnsubscribe = onValue(userRef, (snapshot) => {
          if (snapshot.exists() && snapshot.val().role) {
            console.log("Role from DB:", snapshot.val().role);
            setUserRole(snapshot.val().role);
          } else {
            setUserRole("member");
          }
          setTimeout(() => setAuthLoading(false), 300); 
        });

      } else {
        setUserRole("member");
        setUser(null);
        setSelectedBoardId(null);
        setTimeout(() => setAuthLoading(false), 300);
        if (roleUnsubscribe) roleUnsubscribe(); 
      }
    });

    return () => {
      authUnsubscribe();
      if (roleUnsubscribe) roleUnsubscribe();
    };
  }, []);

  function handleLogout() {
    signOut(auth);
    setSelectedBoardId(null);
  }

  if (authLoading) return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", 
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f8fafc"
      }}>
        <div style={{
          width: 56, height: 56, background: "#0d9488", borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, iconFloat 3s ease-in-out infinite",
          marginBottom: 20
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" style={{ stroke: "white", fill: "none", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <rect x="3" y="3" width="7" height="18" rx="1.5" />
            <rect x="14" y="3" width="7" height="10" rx="1.5" />
            <rect x="14" y="17" width="7" height="4" rx="1.5" />
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          SyncBoard
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, fontWeight: 500 }}>
          Authenticating workspace...
        </div>
      </div>
    </>
  );

  const pageKey = !user ? "auth" : selectedBoardId ? `board-${selectedBoardId}` : "boards";

  return (
    <>
      <style>{globalStyles}</style>
      <div key={pageKey} className="page-transition">
        {!user ? (
          <Auth />
        ) : !selectedBoardId ? (
          <Boards
            user={user}
            userRole={userRole} 
            onSelectBoard={setSelectedBoardId}
            onLogout={handleLogout}
          />
        ) : (
          <Board
            user={user}
            userRole={userRole} 
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