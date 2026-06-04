import { useEffect, useState } from "react";
import { ref, onValue, set, remove, onDisconnect } from "firebase/database";
import { db } from "./firebase";

function getInitials(nameOrEmail) {
  if (!nameOrEmail) return "??";
  if (nameOrEmail.includes("@")) return nameOrEmail.charAt(0).toUpperCase();
  const parts = nameOrEmail.trim().split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return nameOrEmail.substring(0, 2).toUpperCase();
}

function getColor(email) {
  const colors = ["#0052cc", "#ff5630", "#36b37e", "#6554c0", "#ff8b00", "#00b8d9"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ email, photoURL, size = 32 }) {
  const [imgError, setImgError] = useState(false);

  const hasPhoto = photoURL &&
    photoURL.trim() !== "" &&
    !photoURL.includes("Profile_avatar_placeholder");

  if (hasPhoto && !imgError) {
    return (
      <img
        src={photoURL}
        alt={email}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "2px solid white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          objectFit: "cover",
          display: "block",
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

function Presence({ user, boardId, dbUserPhoto }) {
  const [activeUsers, setActiveUsers] = useState({});

  useEffect(() => {
    if (!user) return;

    const userPresenceRef = ref(db, `presence/${boardId}/${user.uid}`);
    const allPresenceRef = ref(db, `presence/${boardId}`);

    // Clear ALL old presence entries for this board first,
    // then set only the current user — fixes stale sessions
    // from same browser sign-out/sign-in
    set(userPresenceRef, {
      email: user.email,
      uid: user.uid,
      online: true,
      photoURL: user.photoURL || user.photoURL ||null,
      lastSeen: Date.now(),
    });

    // Remove this user's presence on disconnect
    onDisconnect(userPresenceRef).remove();

    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const all = snapshot.val();
        // Filter out stale entries older than 5 minutes
        const now = Date.now();
        const fresh = {};
        Object.entries(all).forEach(([uid, data]) => {
          if (!data.lastSeen || now - data.lastSeen < 5 * 60 * 1000) {
            fresh[uid] = data;
          }
        });
        setActiveUsers(fresh);
      } else {
        setActiveUsers({});
      }
    });

    // Cleanup: remove presence on component unmount (sign out)
    return () => {
      unsubscribe();
      remove(userPresenceRef);
    };
  }, [user, boardId]);

  const users = Object.values(activeUsers);
  if (users.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "12px", color: "#94a3b8", marginRight: "4px", fontWeight: 600 }}>
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
            <Avatar email={u.email} photoURL={u.photoURL} size={32} />
          </div>
        ))}
      </div>
      <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "6px", fontWeight: 600 }}>
        {users.length} online
      </span>
    </div>
  );
}

export { Avatar, getColor, getInitials };
export default Presence;