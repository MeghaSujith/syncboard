import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, set, remove } from "firebase/database";

import BoardsNav from "./components/boards/BoardsNav";
import StatsRow from "./components/boards/StatsRow";
import SearchBar from "./components/boards/SearchBar";
import BoardsGrid from "./components/boards/BoardsGrid";
import CreateBoardModal from "./components/boards/CreateBoardModal";
import { boardsStyles } from "./components/boards/boardStyles";

import { getInitials, computeBoardStats, sortBoardsByDeadline } from "./utils/boardHelpers";
// ── Custom hooks ─────────────────────────────────────────────────────────

function useMounted(delay = 60) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), delay); return () => clearTimeout(t); }, [delay]);
  return mounted;
}

function useDbUser(uid) {
  const [dbUser, setDbUser] = useState(null);
  useEffect(() => {
    if (!uid) return;
    const userProfileRef = ref(db, `users/${uid}`);
    return onValue(userProfileRef, (snap) => {
      if (snap.exists()) setDbUser(snap.val());
    });
  }, [uid]);
  return dbUser;
}

function fetchBoardData(boardId) {
  return new Promise(resolve => {
    const boardRef = ref(db, `boards/${boardId}`);
    onValue(boardRef, (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        resolve({ id: boardId, ...val.info, data: val.data });
      } else {
        resolve({ id: boardId, name: "Unnamed Board" });
      }
    }, { onlyOnce: true });
  });
}

function useUserBoards(user) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userEmail = user.email.replace(/\./g, ",");
    const userBoardsRef = ref(db, `userBoards/${userEmail}`);
    const unsubscribe = onValue(userBoardsRef, (snapshot) => {
      if (snapshot.exists()) {
        const boardIds = Object.keys(snapshot.val());
        Promise.all(boardIds.map(fetchBoardData)).then(list => { setBoards(list); setLoading(false); });
      } else {
        setBoards([]); setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [user]);

  return [boards, loading];
}

function useBoardStats(boards, userEmail) {
  const [myPendingCount, setMyPendingCount] = useState(0);
  const [urgentTaskCount, setUrgentTaskCount] = useState(0);

  useEffect(() => {
    const { pending, urgent } = computeBoardStats(boards, userEmail);
    setMyPendingCount(pending);
    setUrgentTaskCount(urgent);
  }, [boards, userEmail]);

  return { myPendingCount, urgentTaskCount };
}

function useHoverState(closeDelay = 120) {
  const [hovered, setHovered] = useState(null);
  const timeoutRef = useRef(null);

  function onEnter(value) {
    clearTimeout(timeoutRef.current);
    setHovered(value);
  }
  function onLeave() {
    timeoutRef.current = setTimeout(() => setHovered(null), closeDelay);
  }

  return [hovered, onEnter, onLeave];
}

// ── Data mutation helpers ───────────────────────────────────────────────

function createBoard(user, name, deadline) {
  const newBoardId = user.uid + "_" + Date.now();
  const userEmail = user.email.replace(/\./g, ",");
  set(ref(db, `boards/${newBoardId}/info`), {
    name: name.trim(),
    owner: user.email,
    dueDate: deadline,
    members: [user.email],
    createdAt: Date.now(),
  });
  set(ref(db, `userBoards/${userEmail}/${newBoardId}`), true);
}

function deleteBoard(user, boardId) {
  remove(ref(db, `boards/${boardId}`));
  const userEmailKey = user.email.replace(/\./g, ",");
  remove(ref(db, `userBoards/${userEmailKey}/${boardId}`));
}

// ── Main Component ─────────────────────────────────────────────────────

export default function Boards({ user, userRole, onSelectBoard, onLogout }) {
  const [boards, loading] = useUserBoards(user);
  const dbUser = useDbUser(user?.uid);
  const mounted = useMounted();
  const { myPendingCount, urgentTaskCount } = useBoardStats(boards, user.email);
  const [hoveredStat, onStatEnter, onStatLeave] = useHoverState(120);

  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDeadline, setNewBoardDeadline] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const profileTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const isTeamLead = userRole === "team_lead";

  useEffect(() => {
    if (showCreate && inputRef.current) inputRef.current.focus();
  }, [showCreate]);

  function handleCreateBoard() {
    if (!newBoardName.trim() || !newBoardDeadline) {
      alert("Please enter both a project name and a deadline.");
      return;
    }
    setCreating(true);
    createBoard(user, newBoardName, newBoardDeadline);
    setNewBoardName("");
    setNewBoardDeadline("");
    setCreating(false);
    setShowCreate(false);
  }

  function handleDeleteBoard(e, boardId, boardName) {
    e.stopPropagation();
    if (window.confirm(`⚠️ Are you sure you want to completely delete the project "${boardName}"?`)) {
      deleteBoard(user, boardId);
    }
  }

  function handleProfileMouseEnter() {
    clearTimeout(profileTimeoutRef.current);
    setShowProfileCard(true);
  }
  function handleProfileMouseLeave() {
    profileTimeoutRef.current = setTimeout(() => setShowProfileCard(false), 150);
  }

  const sortedBoards = sortBoardsByDeadline(boards);
  const filteredBoards = sortedBoards.filter(b =>
    (b.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = dbUser?.name || user.displayName || user.email.split("@")[0];
  const displayPhoto = dbUser?.photoURL || user.photoURL;
  const hasCustomPhoto = displayPhoto &&
    displayPhoto.trim() !== "" &&
    !displayPhoto.includes("Profile_avatar_placeholder");

  if (loading) return (
    <>
      <style>{boardsStyles}</style>
      <div className="loading"><div className="spinner" /></div>
    </>
  );

  return (
    <>
      <style>{boardsStyles}</style>

      {showCreate && (
        <CreateBoardModal
          inputRef={inputRef}
          newBoardName={newBoardName} setNewBoardName={setNewBoardName}
          newBoardDeadline={newBoardDeadline} setNewBoardDeadline={setNewBoardDeadline}
          creating={creating} onCreate={handleCreateBoard} onClose={() => setShowCreate(false)}
        />
      )}

      <div className={`boards-root${mounted ? " mounted" : ""}`}>
        <BoardsNav
          isTeamLead={isTeamLead} displayName={displayName} displayPhoto={displayPhoto}
          hasCustomPhoto={hasCustomPhoto} userEmail={user.email} showProfileCard={showProfileCard}
          onProfileEnter={handleProfileMouseEnter} onProfileLeave={handleProfileMouseLeave}
          onLogout={onLogout}
        />

        <main className="main">
          <div className="hero-banner">
            <div className="hero-text">
              <h2>Welcome back, {displayName} 👋</h2>
              <p>You have {boards.length} board{boards.length !== 1 ? "s" : ""} — pick up where you left off.</p>
            </div>
            {isTeamLead && (
              <button className="hero-btn" onClick={() => setShowCreate(true)}>
                <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span> New Board
              </button>
            )}
          </div>

          <StatsRow
            boards={boards} myPendingCount={myPendingCount} urgentTaskCount={urgentTaskCount}
            hoveredStat={hoveredStat} onStatEnter={onStatEnter} onStatLeave={onStatLeave}
            userEmail={user.email}
          />

          {boards.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🗂️</div>
              <h3>No boards yet</h3>
              <p>{isTeamLead ? "Create your first board using the button above." : "You haven't been added to any boards yet."}</p>
            </div>
          ) : (
            <>
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

              <div className="section-label">
                {searchQuery
                  ? `${filteredBoards.length} result${filteredBoards.length !== 1 ? "s" : ""} for "${searchQuery}"`
                  : `All boards — ${boards.length}`}
              </div>

              <BoardsGrid
                boards={filteredBoards} searchQuery={searchQuery} isTeamLead={isTeamLead}
                userEmail={user.email} onSelect={onSelectBoard} onDelete={handleDeleteBoard}
              />
            </>
          )}
        </main>
      </div>
    </>
  );
}