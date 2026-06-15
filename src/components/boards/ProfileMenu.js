import React from "react";
import { getInitials } from "../../utils/boardHelpers";

function ProfileCard({ displayName, displayPhoto, hasCustomPhoto, isTeamLead, userEmail, onMouseEnter, onMouseLeave }) {
  return (
    <div className="profile-card" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="profile-card-arrow" />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
        {hasCustomPhoto ? (
          <img
            src={displayPhoto}
            alt="Profile"
            referrerPolicy="no-referrer"
            style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", display: "block", marginBottom: 10, boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}
          />
        ) : (
          <div className="profile-card-photo">{getInitials(displayName)}</div>
        )}
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", textAlign: "center" }}>{displayName}</div>
        <div style={{ marginTop: 6, padding: "3px 12px", background: isTeamLead ? "#f0fdf4" : "#f0fdfa", color: isTeamLead ? "#15803d" : "#0d9488", border: isTeamLead ? "1px solid #bbf7d0" : "1px solid #a7f3d0", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
          {isTeamLead ? "⭐ Team Lead" : "👤 Team Member"}
        </div>
      </div>

      <div style={{ height: 1, background: "#f1f5f9", marginBottom: 14 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <span style={{ fontSize: 12, color: "#475569", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userEmail}
        </span>
      </div>
    </div>
  );
}

export default function ProfileMenu({ displayName, displayPhoto, hasCustomPhoto, isTeamLead, userEmail, showProfileCard, onMouseEnter, onMouseLeave }) {
  return (
    <div className="profile-trigger" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {hasCustomPhoto ? (
        <img
          src={displayPhoto}
          alt="Profile"
          referrerPolicy="no-referrer"
          style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0, boxShadow: "0 2px 8px rgba(13,148,136,0.3)" }}
        />
      ) : (
        <div className="avatar">{getInitials(displayName)}</div>
      )}

      <span className="user-name">{displayName}</span>

      {showProfileCard && (
        <ProfileCard
          displayName={displayName} displayPhoto={displayPhoto} hasCustomPhoto={hasCustomPhoto}
          isTeamLead={isTeamLead} userEmail={userEmail}
          onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
        />
      )}
    </div>
  );
}