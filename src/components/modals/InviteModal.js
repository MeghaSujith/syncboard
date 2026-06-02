import { useState } from "react";
import { db } from "../../firebase";
import { ref, set } from "firebase/database";

const ACCENT = "#0d9488";

function InviteModal({ boardInfo, boardId, onClose }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  function handleInvite() {
    if (!email.trim()) return;
    const currentMembers = boardInfo?.members || [];
    if (currentMembers.includes(email.trim())) { setMsg("Already a member!"); return; }
    set(ref(db, `boards/${boardId}/info/members`), [...currentMembers, email.trim()]);
    const userEmail = email.trim().replace(/\./g, ",");
    set(ref(db, `userBoards/${userEmail}/${boardId}`), true);
    setEmail("");
    setMsg("✅ Invited successfully!");
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: 440, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.1)", animation: "popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Invite to board</div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Members can view and edit all cards</div>
        <div style={{ display: "flex", gap: 12 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInvite()}
            placeholder="colleague@email.com"
            style={{ flex: 1, padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#f8fafc" }}
            onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "white"; }} onBlur={e => e.target.style.borderColor = "#e2e8f0"}
          />
          <button onClick={handleInvite} style={{ padding: "0 24px", background: ACCENT, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
            Invite
          </button>
        </div>
        {msg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 500, color: msg.startsWith("✅") ? "#16a34a" : "#b91c1c" }}>{msg}</div>}
      </div>
    </div>
  );
}

export default InviteModal;