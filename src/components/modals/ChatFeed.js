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

export default function ChatFeed({ boardId, user, userRole, onClose }) {
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
      role: userRole || "member", // Save the actual role
      timestamp: Date.now()
    });
    setText("");
  }

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 380, background: "white", borderLeft: "1px solid #e2e8f0", zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-10px 0 40px rgba(0,0,0,0.08)", animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(8px)" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            💬 Team Chat
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: 500 }}>Private project discussion</div>
        </div>
        <button onClick={onClose} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}>✕</button>
      </div>

      {/* Message Feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20, background: "#f8fafc" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, marginTop: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.5 }}>👋</div>
            <span style={{ fontWeight: 600 }}>No messages yet.</span><br/>Say hello to the team!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderEmail === user.email;
            const isLead = msg.role === "team_lead";
            const initial = (msg.senderName || "?")[0].toUpperCase();

            return (
              <div key={i} style={{ display: "flex", gap: 10, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
                
                {/* User Avatar */}
                <div style={{ 
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: isLead ? "linear-gradient(135deg, #ca8a04, #eab308)" : "linear-gradient(135deg, #0d9488, #0ea5e9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  {initial}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                  
                  {/* Name & Badge Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, padding: "0 4px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      {isMe ? "You" : msg.senderName}
                    </span>
                    {isLead && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: "#fef08a", color: "#854d0e", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Lead</span>
                    )}
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{timeAgoShort(msg.timestamp)}</span>
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                    fontSize: 14,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                    // Beautiful custom styling based on role and sender
                    background: isLead ? (isMe ? "linear-gradient(135deg, #ca8a04, #d97706)" : "#fef9c3") : (isMe ? "linear-gradient(135deg, #0d9488, #0f766e)" : "white"),
                    color: isLead ? (isMe ? "white" : "#854d0e") : (isMe ? "white" : "#0f172a"),
                    border: isLead && !isMe ? "1px solid #fde047" : (!isMe ? "1px solid #e2e8f0" : "none"),
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                  }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: "16px 20px", background: "white", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", gap: 10, background: "#f1f5f9", padding: 6, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => { if(e.key === "Enter") handleSend(); }}
            placeholder="Write a message..." 
            style={{ flex: 1, padding: "10px 14px", border: "none", background: "transparent", fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <button 
            onClick={handleSend}
            disabled={!text.trim()}
            style={{ 
              background: text.trim() ? "#0d9488" : "#cbd5e1", 
              color: "white", border: "none", borderRadius: 8, padding: "0 20px", 
              cursor: text.trim() ? "pointer" : "not-allowed", 
              fontWeight: 700, transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: text.trim() ? "0 4px 10px rgba(13,148,136,0.3)" : "none"
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}