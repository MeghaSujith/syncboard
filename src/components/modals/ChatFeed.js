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
  // Soft indigo for your dark bubbles, bold indigo for light bubbles
  const mentionColor = isMe ? "#a5b4fc" : "#4f46e5"; 

  return text.split(/(@[a-zA-Z0-9_.-]+)/).map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} style={{ 
          color: mentionColor, 
          fontWeight: 600, 
          background: isMe ? "rgba(255,255,255,0.15)" : "rgba(79, 70, 229, 0.08)", 
          padding: "1px 5px", 
          borderRadius: 4 
        }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function ChatFeed({ boardId, user, userRole, members, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [profiles, setProfiles] = useState({});
  const messagesEndRef = useRef(null);

  // Fetch all user profiles to get their profile pictures
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(usersRef, (snap) => {
      if (snap.exists()) {
        const allUsers = Object.values(snap.val());
        const profMap = {};
        allUsers.forEach(u => {
          profMap[u.email] = u;
        });
        setProfiles(profMap);
      }
    });
    return () => unsub();
  }, []);

  // Fetch chat messages
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
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 380, background: "#f8fafc", borderLeft: "1px solid #e2e8f0", zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(15, 23, 42, 0.06)", animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            Team Chat
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2, fontWeight: 500 }}>Project discussions</div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "1px solid transparent", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>✕</button>
      </div>

      {/* Message Feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginTop: 60 }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.8 }}>💬</div>
            <span style={{ fontWeight: 600, color: "#334155" }}>Start the conversation</span><br/><span style={{ fontSize: 13 }}>Messages sent here are visible to the team.</span>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderEmail === user.email;
            const isLead = msg.role === "team_lead";
            
            const senderProfile = profiles[msg.senderEmail];
            const hasPhoto = senderProfile?.photoURL && !senderProfile.photoURL.includes("Profile_avatar_placeholder");
            const initial = (msg.senderName || "?")[0].toUpperCase();

            // Rich Indigo for you, Crisp White with drop shadow for others
            const bubbleTheme = isMe 
              ? { background: "#4f46e5", color: "#ffffff", border: "none", boxShadow: "0 2px 6px rgba(79, 70, 229, 0.2)" } 
              : { background: "#ffffff", color: "#334155", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(15, 23, 42, 0.04)" };

            return (
              <div key={i} style={{ display: "flex", gap: 12, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-start" }}>
                
                {/* Avatar Column with LEAD tag */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, marginTop: 2 }}>
                  {isLead && (
                    <span style={{ fontSize: 9, fontWeight: 800, background: "#e0e7ff", color: "#4f46e5", padding: "2px 5px", borderRadius: 4, letterSpacing: 0.5, border: "1px solid #c7d2fe" }}>
                      LEAD
                    </span>
                  )}
                  {hasPhoto ? (
                    <img src={senderProfile.photoURL} alt={msg.senderName} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }} />
                  ) : (
                    <div style={{ 
                      width: 32, height: 32, borderRadius: "50%",
                      background: isMe ? "linear-gradient(135deg, #4f46e5, #4338ca)" : "linear-gradient(135deg, #cbd5e1, #94a3b8)", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.05)"
                    }}>
                      {initial}
                    </div>
                  )}
                </div>

                {/* Message Content Column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                  
                  {/* Name & Timestamp anchored to the bubble */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6, padding: "0 4px" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                      {isMe ? "You" : msg.senderName}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                      {timeAgoShort(msg.timestamp)}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    borderTopRightRadius: isMe ? 2 : 12,
                    borderTopLeftRadius: isMe ? 12 : 2,
                    fontSize: 14,
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

      {/* Input Area */}
      <div style={{ padding: "20px 24px", background: "#ffffff", borderTop: "1px solid #e2e8f0", zIndex: 10 }}>
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          background: "#ffffff", 
          borderRadius: 8, 
          border: `1px solid ${isFocused ? "#4f46e5" : "#cbd5e1"}`, 
          boxShadow: isFocused ? "0 0 0 3px rgba(79, 70, 229, 0.15)" : "0 1px 2px rgba(0,0,0,0.02)",
          transition: "all 0.2s ease",
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
              width: "100%", padding: "14px 16px", border: "none", background: "transparent", 
              fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none", color: "#0f172a",
              minHeight: "48px"
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Use <strong style={{color: "#4f46e5"}}>@</strong> to mention</span>
            <button 
              onClick={handleSend}
              disabled={!text.trim()}
              style={{ 
                background: text.trim() ? "#4f46e5" : "#e2e8f0", 
                color: text.trim() ? "#ffffff" : "#94a3b8", 
                border: "none", borderRadius: 6, padding: "8px 16px", 
                cursor: text.trim() ? "pointer" : "not-allowed", 
                fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                boxShadow: text.trim() ? "0 2px 4px rgba(79, 70, 229, 0.3)" : "none"
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