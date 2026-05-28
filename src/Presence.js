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

function Presence({ user }) {
  const [activeUsers, setActiveUsers] = useState({});

  useEffect(() => {
    if (!user) return;

    const userPresenceRef = ref(db, `presence/${user.uid}`);
    const allPresenceRef = ref(db, "presence");

    // Set this user as online
    set(userPresenceRef, {
      email: user.email,
      uid: user.uid,
      online: true,
    });

    // Automatically remove when browser closes or disconnects
    onDisconnect(userPresenceRef).remove();

    // Listen to all active users
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      if (snapshot.exists()) {
        setActiveUsers(snapshot.val());
      } else {
        setActiveUsers({});
      }
    });

    return () => {
      unsubscribe();
      // Don't remove presence here — onDisconnect handles it
    };
  }, [user]);

  const users = Object.values(activeUsers);
  if (users.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "12px", color: "#666", marginRight: "4px" }}>
        Active:
      </span>
      {users.map((u) => (
        <div
          key={u.uid}
          title={u.email}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: getColor(u.email),
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "default",
            border: "2px solid white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {getInitials(u.email)}
        </div>
      ))}
    </div>
  );
}

export default Presence;