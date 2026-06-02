import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { ref, onValue, push } from "firebase/database";

function timeAgoShort(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export default function ChatFeed({ boardId, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // Real-time Firebase Listener for Chat
  useEffect(() => {
    const chatRef = ref(db, `boards/${boardId}/chat`);
    const unsubscribe = onValue(chatRef, (snap) => {
      if (snap.exists()) {
        const msgs = Object.values(snap.val()).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, [boardId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!text.trim()) return;
    const chatRef = ref(db, `boards/${boardId}/chat`);
    push(chatRef, {
      text: text.trim(),
      senderEmail: user.email,
      senderName: user.displayName || user.email.split("@")[0],
      role: user.role || "member",
      timestamp: Date.now()
    });
    setText("");
  }

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 380, background: "white", borderLeft: "1px solid #e2e8f0", zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-10px 0 30px rgba(0,0,0,0.05)", animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            💬 Team Chat
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Private board discussion</div>
        </div>
        <button onClick={onClose} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "white"}>✕</button>
      </div>

      {/* Message Feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, background: "#f8fafc" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, marginTop: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>👋</div>
            Say hello to the team!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderEmail === user.email;
            const isLead = msg.role === "team_lead";

            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                
                {/* Name & Badge Row */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, marginLeft: isMe ? 0 : 4, marginRight: isMe ? 4 : 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                    {isMe ? "You" : msg.senderName}
                  </span>
                  {isLead && (
                    <span style={{ fontSize: 9, fontWeight: 800, background: "#fef08a", color: "#854d0e", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Lead</span>
                  )}
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgoShort(msg.timestamp)}</span>
                </div>

                {/* Message Bubble */}
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  borderTopRightRadius: isMe ? 4 : 12,
                  borderTopLeftRadius: isMe ? 12 : 4,
                  fontSize: 14,
                  lineHeight: 1.5,
                  maxWidth: "85%",
                  wordBreak: "break-word",
                  // Distinct styling for Team Lead messages vs regular members
                  background: isLead ? (isMe ? "#ca8a04" : "#fef9c3") : (isMe ? "#0d9488" : "white"),
                  color: isLead ? (isMe ? "white" : "#854d0e") : (isMe ? "white" : "#0f172a"),
                  border: isLead ? "none" : (isMe ? "none" : "1px solid #e2e8f0"),
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "white" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => { if(e.key === "Enter") handleSend(); }}
            placeholder="Type a message..." 
            style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <button 
            onClick={handleSend}
            disabled={!text.trim()}
            style={{ background: text.trim() ? "#0d9488" : "#cbd5e1", color: "white", border: "none", borderRadius: 8, padding: "0 16px", cursor: text.trim() ? "pointer" : "not-allowed", fontWeight: 600, transition: "0.2s" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}