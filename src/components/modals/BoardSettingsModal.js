import React, { useState } from "react";
import { db } from "../../firebase";
import { ref, set } from "firebase/database";
import { getInitials, BOARD_BACKGROUNDS } from "../../utils/boardHelpers";

function MembersTab({ boardId, members, owner, currentUserEmail, isTeamLead, memberProfiles }) {
  const handleRemove = (email) => {
    if (!window.confirm(`Remove ${email} from this board?`)) return;
    set(ref(db, `boards/${boardId}/info/members`), members.filter(m => m !== email));
    set(ref(db, `userBoards/${email.replace(/\./g, ",")}/${boardId}`), null);
  };

  return (
    <div style={{ padding: "8px 24px" }}>
      {members.map(email => {
        const profile = memberProfiles[email] || {};
        const name = profile.name || email.split("@")[0];
        const hasPhoto = profile.photo && !profile.photo.includes("placeholder");

        return (
          <div key={email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {hasPhoto ? (
                <img src={profile.photo} alt={name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid #e2e8f0" }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0ea5e9", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{getInitials(name)}</div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{name}</div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{email === owner ? "👑 Board Owner" : "Member"}</div>
              </div>
            </div>
            {isTeamLead && email !== owner && email !== currentUserEmail && (
              <button onClick={() => handleRemove(email)} style={{ padding: "6px 12px", background: "#fff1f2", color: "#e11d48", border: "1px solid #ffe4e6", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#ffe4e6"} onMouseLeave={e => e.currentTarget.style.background = "#fff1f2"}>Remove</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AppearanceTab({ boardId, currentBgId, currentUserUid }) {
  return (
    <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {BOARD_BACKGROUNDS.map(bg => (
        <div key={bg.id} onClick={() => set(ref(db, `users/${currentUserUid}/boardBackgrounds/${boardId}`), bg.id)} style={{ padding: 10, border: `2px solid ${currentBgId === bg.id ? "#0d9488" : "#e2e8f0"}`, borderRadius: 12, cursor: "pointer", transition: "0.2s" }}>
          <div style={{ height: 60, borderRadius: 8, background: bg.bg, marginBottom: 10, border: "1px solid rgba(0,0,0,0.05)" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", textAlign: "center" }}>{bg.name}</div>
        </div>
      ))}
    </div>
  );
}

export default function BoardSettingsModal({ boardInfo, boardId, currentUserEmail, currentUserUid, currentBgId, isTeamLead, memberProfiles = {}, onClose }) {
  const [tab, setTab] = useState("members");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", fontFamily: "'Plus Jakarta Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "white", width: 480, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", animation: "popIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Board Settings</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <button onClick={() => setTab("members")} style={{ flex: 1, padding: "14px", border: "none", borderBottom: `2px solid ${tab === "members" ? "#0d9488" : "transparent"}`, background: "transparent", fontSize: 13, fontWeight: 700, color: tab === "members" ? "#0d9488" : "#64748b", cursor: "pointer" }}>👥 Members</button>
          <button onClick={() => setTab("appearance")} style={{ flex: 1, padding: "14px", border: "none", borderBottom: `2px solid ${tab === "appearance" ? "#0d9488" : "transparent"}`, background: "transparent", fontSize: 13, fontWeight: 700, color: tab === "appearance" ? "#0d9488" : "#64748b", cursor: "pointer" }}>🎨 Appearance</button>
        </div>
        <div style={{ minHeight: 300, maxHeight: 420, overflowY: "auto" }}>
          {tab === "members" ? <MembersTab boardId={boardId} members={boardInfo?.members || []} owner={boardInfo?.owner} currentUserEmail={currentUserEmail} isTeamLead={isTeamLead} memberProfiles={memberProfiles} /> : <AppearanceTab boardId={boardId} currentBgId={currentBgId} currentUserUid={currentUserUid} />}
        </div>
      </div>
    </div>
  );
}