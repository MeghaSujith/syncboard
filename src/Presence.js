import { useEffect, useState } from "react";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { db } from "./firebase";

function getInitials(email) {
  return email ? email.slice(0, 2).toUpperCase() : "??";
}

function getColor(email) {
  const colors = ["#0052cc", "#ff5630", "#36b37e", "#6554c0", "#ff8b00", "#00b8d9"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}



function Avatar({ email, size = 32 }) {
  const [gravatarUrl, setGravatarUrl] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!email) return;
    // Use DiceBear API for consistent, beautiful avatars based on email
    const seed = encodeURIComponent(email);
    setGravatarUrl(`https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=0052cc,ff5630,36b37e,6554c0,ff8b00,00b8d9&backgroundType=gradientLinear&fontSize=38&fontWeight=700`);
  }, [email]);

  if (gravatarUrl && !imgError) {
    return (
      <img
        src={gravatarUrl}
        alt={email}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "2px solid white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: getColor(email),
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.35,
      fontWeight: "bold",
      border: "2px solid white",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    }}>
      {getInitials(email)}
    </div>
  );
}

function Presence({ user, boardId }) {
  const [activeUsers, setActiveUsers] = useState({});

  useEffect(() => {
    if (!user) return;

    const userPresenceRef = ref(db, `presence/${boardId}/${user.uid}`);
    const allPresenceRef = ref(db, `presence/${boardId}`);

    set(userPresenceRef, {
      email: user.email,
      uid: user.uid,
      online: true,
      photoURL: user.photoURL || null,
    });

    onDisconnect(userPresenceRef).remove();

    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      if (snapshot.exists()) {
        setActiveUsers(snapshot.val());
      } else {
        setActiveUsers({});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, boardId]);

  const users = Object.values(activeUsers);
  if (users.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "12px", color: "#666", marginRight: "4px" }}>
        Active:
      </span>
      <div style={{ display: "flex", alignItems: "center" }}>
        {users.map((u, index) => (
          <div
            key={u.uid}
            title={u.email}
            style={{
              marginLeft: index > 0 ? "-8px" : "0",
              zIndex: users.length - index,
              cursor: "default",
              transition: "transform 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <Avatar email={u.email} size={32} />
          </div>
        ))}
      </div>
      {users.length > 1 && (
        <span style={{ fontSize: "11px", color: "#666", marginLeft: "6px" }}>
          {users.length} online
        </span>
      )}
    </div>
  );
}

export { Avatar, getColor, getInitials };
export default Presence;