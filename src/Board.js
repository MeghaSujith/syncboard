import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { db } from "./firebase";
import { ref, onValue, set, push } from "firebase/database";

import Presence from "./Presence";
import AnalyticsModal from "./components/modals/AnalyticsModal";
import CardDetailModal from "./components/modals/CardDetailModal";
import ChatFeed from "./components/modals/ChatFeed";
import ActivityFeed from "./components/modals/ActivityFeed";
import InviteModal from "./components/modals/InviteModal";
import BoardSettingsModal from "./components/modals/BoardSettingsModal";
import CardItem from "./components/board/CardItem";
import AddCardForm from "./components/board/AddCardForm";
import FilterBar from "./components/board/FilterBar";
import NotificationBell from "./components/board/NotificationBell";
import SidebarDock from "./components/board/SidebarDock";
import { ACCENT, COLUMN_COLORS, defaultColumns, getInitials, fixData, BOARD_BACKGROUNDS } from "./utils/boardHelpers";

// ── Custom hooks for data subscriptions ────────────────────────────────────

function useBoardData(boardId) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!boardId) return;
    const boardRef = ref(db, `boards/${boardId}/data`);
    return onValue(boardRef, snap => {
      if (snap.exists()) setData(fixData(snap.val()));
      else set(boardRef, { columns: defaultColumns, cards: {}, columnOrder: ["todo", "inprogress", "review", "done"] });
    });
  }, [boardId]);
  return [data, setData];
}

function useBoardInfo(boardId) {
  const [boardInfo, setBoardInfo] = useState(null);
  useEffect(() => {
    if (!boardId) return;
    return onValue(ref(db, `boards/${boardId}/info`), snap => {
      if (snap.exists()) setBoardInfo(snap.val());
      else setBoardInfo(null);
    });
  }, [boardId]);
  return boardInfo;
}

function useActivities(boardId) {
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    if (!boardId) return;
    return onValue(ref(db, `boards/${boardId}/activity`), snap => {
      if (snap.exists()) setActivities(Object.values(snap.val()));
      else setActivities([]);
    });
  }, [boardId]);
  return activities;
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true), off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return isOnline;
}

function useDbUser(uid) {
  const [dbUser, setDbUser] = useState(null);
  useEffect(() => {
    if (!uid) {
      setDbUser(null);
      return;
    }
    const userProfileRef = ref(db, `users/${uid}`);
    return onValue(userProfileRef, (snap) => {
      if (snap.exists()) setDbUser(snap.val());
      else setDbUser(null);
    });
  }, [uid]);
  return dbUser;
}

function useNotifications(userEmail) {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    if (!userEmail) {
      setNotifications([]);
      return;
    }
    const userEmailKey = userEmail.replace(/\./g, ",");
    const notifRef = ref(db, `userNotifications/${userEmailKey}`);
    return onValue(notifRef, snap => {
      if (snap.exists()) {
        const notifs = Object.values(snap.val()).sort((a, b) => a.timestamp - b.timestamp);
        setNotifications(notifs);
      } else {
        setNotifications([]);
      }
    });
  }, [userEmail]);
  return notifications;
}

function useMemberProfiles(members) {
  const [memberProfiles, setMemberProfiles] = useState({});
  useEffect(() => {
    if (!members || members.length === 0) {
      setMemberProfiles({});
      return;
    }
    const usersRef = ref(db, "users");
    onValue(usersRef, (snap) => {
      if (!snap.exists()) return;
      const allUsers = Object.values(snap.val());
      const profiles = {};
      members.forEach(email => {
        const found = allUsers.find(u => u.email === email);
        profiles[email] = {
          name:  found?.name  || email.split("@")[0],
          photo: found?.photoURL || null,
        };
      });
      setMemberProfiles(profiles);
    }, { onlyOnce: true });
  }, [members]);
  return memberProfiles;
}

function useMounted(delay = 60) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), delay); return () => clearTimeout(t); }, [delay]);
  return mounted;
}

// ── Data mutation helpers ───────────────────────────────────────────────────

function logActivity(boardId, user, action) {
  push(ref(db, `boards/${boardId}/activity`), { user: user.email, action, timestamp: Date.now() });
}

function addNotification(user, message) {
  if (!user || !user.email) return;
  const userEmailKey = user.email.replace(/\./g, ",");
  push(ref(db, `userNotifications/${userEmailKey}`), { message, timestamp: Date.now(), read: false });
}

function moveCardBetweenColumns(data, source, destination, draggableId) {
  const sourceCol = data.columns[source.droppableId];
  const destCol   = data.columns[destination.droppableId];
  const sourceIds = [...sourceCol.cardIds];
  const destIds   = sourceCol.id === destCol.id ? sourceIds : [...destCol.cardIds];

  sourceIds.splice(source.index, 1);
  destIds.splice(destination.index, 0, draggableId);

  return {
    ...data,
    columns: {
      ...data.columns,
      [sourceCol.id]: { ...sourceCol, cardIds: sourceIds },
      [destCol.id]:   { ...destCol,   cardIds: destIds },
    },
  };
}

async function sendDigestRequest(boardId, boardName) {
  const res = await fetch("http://localhost:5000/api/digest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boardId, boardName }),
  });
  const responseData = await res.json();
  return { ok: res.ok, error: responseData.error };
}

function formatDisplayName(rawName) {
  return rawName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

// ── UI sub-pieces ────────────────────────────────────────────────────────────

function OfflineBanner({ isOnline }) {
  if (isOnline) return null;
  return (
    <div style={{ background: "#ef4444", color: "white", padding: "10px 24px", textAlign: "center", fontSize: 15, fontWeight: 600 }}>
      ⚡ You're offline — changes will sync when reconnected
    </div>
  );
}

function DigestButton({ isTeamLead, sendingDigest, onClick }) {
  if (!isTeamLead) return null;
  return (
    <button
      onClick={onClick}
      disabled={sendingDigest}
      style={{
        padding: "8px 14px", 
        background: sendingDigest ? "#334155" : "#1e293b", 
        color: "#f8fafc", 
        border: "1px solid #334155",
        borderRadius: 8, 
        cursor: sendingDigest ? "not-allowed" : "pointer", 
        fontSize: 13, 
        fontWeight: 600, 
        fontFamily: "inherit",
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        transition: "all 0.2s ease",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)"
      }}
      onMouseEnter={e => { 
        if (!sendingDigest) { 
          e.currentTarget.style.background = "#334155"; 
          e.currentTarget.style.borderColor = "#475569"; 
        } 
      }}
      onMouseLeave={e => { 
        if (!sendingDigest) { 
          e.currentTarget.style.background = "#1e293b"; 
          e.currentTarget.style.borderColor = "#334155"; 
        } 
      }}
    >
      {sendingDigest ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      )}
      {sendingDigest ? "Sending..." : "Team Lead Digest"}
    </button>
  );
}
function UserBadge({ hasCustomPhoto, displayPhoto, displayName }) {
  return (
    <div 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        padding: "4px 12px 4px 4px", 
        marginLeft: 8, 
        background: "#1e293b", 
        border: "1px solid #334155", 
        borderRadius: 24, 
        whiteSpace: "nowrap",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#334155"}
      onMouseLeave={e => e.currentTarget.style.background = "#1e293b"}
    >
      {hasCustomPhoto ? (
        <img 
          src={displayPhoto} 
          alt="Profile" 
          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid #475569" }} 
        />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#f8fafc", border: "1px solid #475569" }}>
          {getInitials(displayName)}
        </div>
      )}
      <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>
        {displayName}
      </span>
    </div>
  );
}

function BoardNav({
  boardInfo, data, user, dbUser, isTeamLead, sendingDigest, onSendDigest,
  notifications, onLogout, onBack, onInvite,
  displayName, displayPhoto, hasCustomPhoto, boardId
}) {
  return (
    <nav style={{
      background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "16px 32px", minHeight: 72,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#1e293b", border: "none",
          borderRadius: 8, cursor: "pointer", fontSize: 15, color: "#e2e8f0", fontFamily: "inherit", fontWeight: 600, transition: "0.2s",
        }} onMouseEnter={e => { e.currentTarget.style.background = "#334155"; }} onMouseLeave={e => { e.currentTarget.style.background = "#1e293b"; }}>
          ← My Boards
        </button>
        <div style={{ width: 1, height: 28, background: "#334155" }} />
        <div style={{ minWidth: "max-content" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>{boardInfo?.name || "Task 1"}</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2, fontWeight: 500 }}>
            {Object.values(data.cards || {}).length} cards · {(boardInfo?.members || []).length} members
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8, whiteSpace: "nowrap" }}>
          <Presence user={user} boardId={boardId} dbUserPhoto={dbUser?.photoURL} />
        </div>

        <DigestButton isTeamLead={isTeamLead} sendingDigest={sendingDigest} onClick={onSendDigest} />

        <button onClick={onInvite} style={{
          padding: "8px 16px", background: ACCENT, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, marginLeft: 8, boxShadow: "0 4px 6px rgba(13, 148, 136, 0.3)"
        }}>
          + Invite
        </button>

        <UserBadge hasCustomPhoto={hasCustomPhoto} displayPhoto={displayPhoto} displayName={displayName} />

        <button onClick={onLogout} style={{
          padding: "8px 16px", background: "transparent", color: "#ef4444", border: "1px solid #7f1d1d", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", transition: "0.2s"
        }} onMouseEnter={e => { e.currentTarget.style.background = "#7f1d1d"; e.currentTarget.style.color = "white"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ef4444"; }}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

function FilterSummary({ hasFilter, data, filteredCardIds }) {
  if (!hasFilter) return null;
  return (
    <div style={{ marginBottom: 20, fontSize: 15, color: "#64748b", fontWeight: 500 }}>
      Showing filtered results — <span style={{ color: ACCENT, fontWeight: 700 }}>
        {Object.values(data.columns).reduce((acc, col) => acc + filteredCardIds(col.cardIds).length, 0)}
      </span> cards match
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap');
      
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: 'Inter', sans-serif; 
        background-color: #f8fafc; 
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes popIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      .board-root { opacity: 0; transition: opacity 0.4s ease; }
      .board-root.mounted { opacity: 1; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; border: 2px solid #f8fafc; }
      ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `}</style>
  );
}

function ColumnHeader({ column, cc, hasFilter, visibleCount, totalCount }) {
  return (
    <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(15, 23, 42, 0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: cc.theme }} />
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
          {column.title}
        </span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "white", color: "#64748b", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
        {hasFilter ? `${visibleCount}/${totalCount}` : totalCount}
      </span>
    </div>
  );
}

function BoardColumn({ colId, column, cc, cards, hasFilter, onDelete, onEdit, onOpen, onAddCard, memberProfiles }) {
  return (
    <div style={{
      width: 310, flexShrink: 0, background: cc.bg, borderRadius: 12, 
      borderTop: `3px solid ${cc.theme}`, 
      boxShadow: "0 1px 2px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(15, 23, 42, 0.05)", 
      display: "flex", flexDirection: "column"
    }}>
      <ColumnHeader column={column} cc={cc} hasFilter={hasFilter} visibleCount={cards.length} totalCount={column.cardIds.length} />

      <Droppable droppableId={colId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              padding: "16px", minHeight: 150, background: snapshot.isDraggingOver ? "rgba(15, 23, 42, 0.04)" : "transparent",
              borderBottomLeftRadius: 12, borderBottomRightRadius: 12, transition: "0.2s"
            }}
          >
            {cards.length === 0 && !snapshot.isDraggingOver && (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "30px 0", userSelect: "none" }}>
                Drop cards here
              </div>
            )}
            {cards.map((card, index) => (
              <CardItem
                key={card.id} card={card} index={index} colColor={cc} colId={colId}
                onDelete={onDelete} onEdit={onEdit} onOpen={onOpen} memberProfiles={memberProfiles}
              />
            ))}
            {provided.placeholder}
            {!hasFilter && <AddCardForm columnId={colId} onAdd={onAddCard} colTheme={cc.theme} />}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "4px solid #cbd5e1", borderTopColor: ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 16, color: "#64748b", fontWeight: 500 }}>Loading workspace...</div>
      </div>
    </div>
  );
}

// ─── Main Board Component ─────────────────────────────────────────────────────
export default function Board({ user, userRole, boardId, onLogout, onBack }) {
  const isTeamLead = userRole === "team_lead";

  const [data] = useBoardData(boardId);
  const boardInfo = useBoardInfo(boardId);
  const activities = useActivities(boardId);
  const isOnline = useOnlineStatus();
  const mounted = useMounted();
  const dbUser = useDbUser(user?.uid);
  const notifications = useNotifications(user?.email);
  const memberProfiles = useMemberProfiles(boardInfo?.members);

  const [selectedCard, setSelectedCard] = useState(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  const [search, setSearch] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const currentBgId = dbUser?.boardBackgrounds?.[boardId] || "default";

  async function handleSendDigest() {
    if (!boardId) return;
    setSendingDigest(true);
    try {
      const { ok, error } = await sendDigestRequest(boardId, boardInfo?.name || "Project");
      if (ok) alert("✅ Digest sent successfully!");
      else alert(`❌ Error: ${error}`);
    } catch (e) {
      alert("❌ Failed to send digest. Ensure backend is running on port 5000.");
    } finally {
      setSendingDigest(false);
    }
  }

  function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newData = moveCardBetweenColumns(data, source, destination, draggableId);
    set(ref(db, `boards/${boardId}/data`), newData);

    const cardText = data.cards[draggableId]?.text || "a card";
    if (source.droppableId !== destination.droppableId) {
      const destCol = data.columns[destination.droppableId];
      const sourceCol = data.columns[source.droppableId];
      logActivity(boardId, user, `moved "${cardText}" from ${sourceCol.title} → ${destCol.title}`);
      addNotification(user, `Card "${cardText}" moved to ${destCol.title}`);
    }
  }

  function handleAddCard(columnId, text) {
    const id = "card-" + Date.now();
    const col = data.columns[columnId];
    const newData = {
      ...data,
      cards: { ...data.cards, [id]: { id, text, createdAt: Date.now(), createdBy: user.email, priority: "medium", labels: [], comments: [] } },
      columns: { ...data.columns, [columnId]: { ...col, cardIds: [...col.cardIds, id] } },
    };
    set(ref(db, `boards/${boardId}/data`), newData);
    logActivity(boardId, user, `added card "${text}" to ${col.title}`);
  }

  function handleDeleteCard(cardId) {
    const text = data.cards[cardId]?.text || "a card";
    const newCards = { ...data.cards };
    delete newCards[cardId];
    const newCols = {};
    Object.keys(data.columns).forEach(cId => {
      newCols[cId] = { ...data.columns[cId], cardIds: data.columns[cId].cardIds.filter(id => id !== cardId) };
    });
    set(ref(db, `boards/${boardId}/data`), { ...data, cards: newCards, columns: newCols });
    logActivity(boardId, user, `deleted card "${text}"`);
  }

  function handleEditCard(cardId, newText) {
    const newData = { ...data, cards: { ...data.cards, [cardId]: { ...data.cards[cardId], text: newText } } };
    set(ref(db, `boards/${boardId}/data`), newData);
    logActivity(boardId, user, `renamed card to "${newText}"`);
  }

  function handleUpdateCard(cardId, updates) {
    const oldCard = data.cards[cardId] || {};
    const newData = { ...data, cards: { ...data.cards, [cardId]: { ...oldCard, ...updates } } };
    set(ref(db, `boards/${boardId}/data`), newData);
  }

  function handleUpdateAndSync(cardId, updates) {
    handleUpdateCard(cardId, updates);
    setSelectedCard(prev => prev && prev.id === cardId ? { ...prev, ...updates } : prev);
  }

  const filteredCardIds = useCallback((cardIds) => {
    if (!search && !filterLabel && !filterAssignee && !filterPriority) return cardIds;
    return cardIds.filter(id => {
      const c = data?.cards?.[id];
      if (!c) return false;
      if (search && !c.text.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLabel && !(c.labels || []).includes(filterLabel)) return false;
      if (filterAssignee && c.assignee !== filterAssignee) return false;
      if (filterPriority && (c.priority || "medium") !== filterPriority) return false;
      return true;
    });
  }, [data, search, filterLabel, filterAssignee, filterPriority]);

  function handleClearNotifications() {
    const userEmailKey = user.email.replace(/\./g, ",");
    set(ref(db, `userNotifications/${userEmailKey}`), null);
  }

  function handleClearFilters() {
    setSearch(""); setFilterLabel(""); setFilterAssignee(""); setFilterPriority("");
  }

  if (!data || !data.columnOrder) return <LoadingScreen />;

  const allAssignees = [...new Set(Object.values(data.cards || {}).map(c => c.assignee).filter(Boolean))];
  const hasFilter = search || filterLabel || filterAssignee || filterPriority;

  const rawName = dbUser?.name || user.displayName || user.email.split("@")[0];
  const displayName = formatDisplayName(rawName);
  const displayPhoto = dbUser?.photoURL || user.photoURL;
  const hasCustomPhoto = displayPhoto && !displayPhoto.includes("Profile_avatar_placeholder");

  return (
    <>
      <GlobalStyles />

      <div
        className={`board-root${mounted ? " mounted" : ""}`}
        style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          transition: "margin-right 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease",
          marginRight: showChat ? 380 : showActivity ? 360 : 0,
          background: BOARD_BACKGROUNDS.find(b => b.id === currentBgId)?.bg || "#f8fafc"
        }}
      >
        <OfflineBanner isOnline={isOnline} />

        <BoardNav
          boardInfo={boardInfo} data={data} user={user} dbUser={dbUser} isTeamLead={isTeamLead}
          sendingDigest={sendingDigest} onSendDigest={handleSendDigest}
          notifications={notifications}
          onLogout={onLogout} onBack={onBack} onInvite={() => setShowInvite(true)}
          displayName={displayName} displayPhoto={displayPhoto} hasCustomPhoto={hasCustomPhoto}
          boardId={boardId}
        />

        <FilterBar
          search={search} setSearch={setSearch} filterLabel={filterLabel} setFilterLabel={setFilterLabel}
          filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee} filterPriority={filterPriority} setFilterPriority={setFilterPriority}
          allAssignees={allAssignees} memberProfiles={memberProfiles} onClear={handleClearFilters}
        />

        <div style={{ flex: 1, overflowX: "auto", padding: "40px 100px 40px 32px" }}>
          <FilterSummary hasFilter={hasFilter} data={data} filteredCardIds={filteredCardIds} />

          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", minWidth: "max-content" }}>
              {data.columnOrder.map((colId) => {
                const column = data.columns[colId];
                if (!column) return null;
                const cc = COLUMN_COLORS[colId] || { theme: "#94a3b8", bg: "#f1f5f9" };
                const visibleIds = filteredCardIds(column.cardIds);
                const cards = visibleIds.map(id => data.cards[id]).filter(Boolean);

                return (
                  <BoardColumn
                    key={colId} colId={colId} column={column} cc={cc} cards={cards} hasFilter={hasFilter}
                    onDelete={handleDeleteCard} onEdit={handleEditCard} onOpen={setSelectedCard}
                    onAddCard={handleAddCard} memberProfiles={memberProfiles}
                  />
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onUpdate={handleUpdateAndSync}
            onDelete={handleDeleteCard}
            user={user}
            logActivity={(action) => logActivity(boardId, user, action)}
            boardName={boardInfo?.name}
            boardId={boardId}
            userRole={userRole}
          />
        )}
      </div>

      <SidebarDock
        showChat={showChat} setShowChat={setShowChat}
        showActivity={showActivity} setShowActivity={setShowActivity}
        setShowAnalytics={setShowAnalytics}
        setShowSettings={() => setShowSettings(true)}
        notifications={notifications} onClearNotifications={handleClearNotifications}
      />

      {showActivity && <ActivityFeed activities={activities} memberProfiles={memberProfiles} onClose={() => setShowActivity(false)} />}
      {showChat && <ChatFeed boardId={boardId} user={user} userRole={userRole} members={boardInfo?.members || []} onClose={() => setShowChat(false)} />}
      {showAnalytics && <AnalyticsModal data={data} onClose={() => setShowAnalytics(false)} />}
      {showInvite && <InviteModal boardInfo={boardInfo} boardId={boardId} onClose={() => setShowInvite(false)} />}
      {showSettings && <BoardSettingsModal boardInfo={boardInfo} boardId={boardId} currentUserEmail={user.email} currentUserUid={user.uid} currentBgId={currentBgId} isTeamLead={isTeamLead} memberProfiles={memberProfiles} onClose={() => setShowSettings(false)} />}
    </>
  );
}