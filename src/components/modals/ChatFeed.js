import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { ref, onValue, push } from "firebase/database";

function timeAgoShort(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function formatChatText(text, isMe) {
  // Bright cyan for dark bubbles, standard blue for light bubbles
  const mentionColor = isMe ? "#67e8f9" : "#0284c7"; 

  return text.split(/(@[a-zA-Z0-9_.-]+)/).map((part, index) => {
    if (part.startsWith('@')) {
      return <span key={index} style={{ color: mentionColor, fontWeight: 600, background: isMe ? "rgba(255,255,255,0.1)" : "rgba(2,132,199,0.08)", padding: "0 4px", borderRadius: 4 }}>{part}</span>;
    }
    return part;
  });
}

export default function ChatFeed({ boardId, user, userRole, members, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!text.trim()) return;
    const currentUsername = user.email.split("@")[0];
    
    const chatRef = ref(db, `boards/${boardId}/chat`);
    push(chatRef, {
      text: text.trim(),
      senderEmail: user.email,
      senderName: user.displayName || currentUsername,
      role: userRole || "member",
      timestamp: Date.now()
    });

    const mentions = text.match(/@([a-zA-Z0-9_.-]+)/g);
    if (mentions && members) {
      mentions.forEach(mention => {
        const taggedName = mention.substring(1).toLowerCase(); 
        const matchedMemberEmail = members.find(m => m.split("@")[0].toLowerCase() === taggedName);
        
        if (matchedMemberEmail) {
          const taggedEmailKey = matchedMemberEmail.replace(/\./g, ",");
          push(ref(db, `userNotifications/${taggedEmailKey}`), {
            message: `💬 ${currentUsername} mentioned you in chat: "${text.trim()}"`,
            boardId: boardId,
            timestamp: Date.now(),
            read: false
          });
        }
      });
    }

    setText("");
  }

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 380, background: "#ffffff", borderLeft: "1px solid #e2e8f0", zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(15, 23, 42, 0.04)", animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Header - Clean & Minimal */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            Team Chat
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>Project discussions</div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "1px solid transparent", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>✕</button>
      </div>

      {/* Message Feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px", display: "flex", flexDirection: "column", gap: 24, background: "#f8fafc" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginTop: 60 }}>
            <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.8 }}>💬</div>
            <span style={{ fontWeight: 600, color: "#334155" }}>Start the conversation</span><br/>Messages sent here are visible to the team.
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderEmail === user.email;
            const isLead = msg.role === "team_lead";
            const initial = (msg.senderName || "?")[0].toUpperCase();

            // Professional, flat color scheme
            const bubbleTheme = isMe 
              ? { background: "#0f172a", color: "#f8fafc", border: "1px solid #0f172a" } // Sleek dark slate for current user
              : { background: "#ffffff", color: "#334155", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }; // Crisp white for others

            return (
              <div key={i} style={{ display: "flex", gap: 12, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
                
                {/* Avatar - Solid colors, smaller size */}
                <div style={{ 
                  width: 24, height: 24, borderRadius: "6px", flexShrink: 0,
                  background: isMe ? "#0d9488" : "#cbd5e1", // Brand teal for you, neutral for others
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "white"
                }}>
                  {initial}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                  
                  {/* Name & Timestamp */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, padding: "0 2px" }}>
                    {!isMe && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                        {msg.senderName}
                      </span>
                    )}
                    {isLead && !isMe && (
                      <span style={{ fontSize: 9, fontWeight: 700, background: "#e0e7ff", color: "#4338ca", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>LEAD</span>
                    )}
                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{timeAgoShort(msg.timestamp)}</span>
                  </div>

                  {/* Message Bubble - Slack/Teams style border radius */}
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    borderBottomRightRadius: isMe ? 2 : 8,
                    borderBottomLeftRadius: isMe ? 8 : 2,
                    fontSize: 13,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                    ...bubbleTheme
                  }}>
                    {formatChatText(msg.text, isMe)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Crisp, Editor-like Text Box */}
      <div style={{ padding: "20px 24px", background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          background: "#ffffff", 
          borderRadius: 8, 
          border: `1px solid ${isFocused ? "#0d9488" : "#cbd5e1"}`, 
          boxShadow: isFocused ? "0 0 0 1px #0d9488" : "0 1px 2px rgba(0,0,0,0.02)",
          transition: "all 0.15s ease",
          overflow: "hidden"
        }}>
          <textarea 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Reply to thread..." 
            rows={1}
            style={{ 
              width: "100%", padding: "12px 14px", border: "none", background: "transparent", 
              fontSize: 13, outline: "none", fontFamily: "inherit", resize: "none", color: "#0f172a",
              minHeight: "44px"
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Use <strong style={{color: "#64748b"}}>@</strong> to mention</span>
            <button 
              onClick={handleSend}
              disabled={!text.trim()}
              style={{ 
                background: text.trim() ? "#0f172a" : "#e2e8f0", 
                color: text.trim() ? "#ffffff" : "#94a3b8", 
                border: "none", borderRadius: 6, padding: "6px 14px", 
                cursor: text.trim() ? "pointer" : "not-allowed", 
                fontSize: 12, fontWeight: 600, transition: "all 0.15s"
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}