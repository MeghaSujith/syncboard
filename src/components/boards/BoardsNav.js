import React from "react";
import ProfileMenu from "./ProfileMenu";

export default function BoardsNav({ isTeamLead, displayName, displayPhoto, hasCustomPhoto, userEmail, showProfileCard, onProfileEnter, onProfileLeave, onLogout }) {
  return (
    <nav className="nav">
      <div className="nav-brand">
        <div className="nav-logo">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" /><rect x="14" y="17" width="7" height="4" rx="1" /></svg>
        </div>
        <span className="nav-title">SyncBoard</span>
      </div>

      <div className="nav-right">
        {isTeamLead && (
          <div className="role-badge">
            <span className="role-badge-dot" />
            Team Lead
          </div>
        )}

        <ProfileMenu
          displayName={displayName} displayPhoto={displayPhoto} hasCustomPhoto={hasCustomPhoto}
          isTeamLead={isTeamLead} userEmail={userEmail} showProfileCard={showProfileCard}
          onMouseEnter={onProfileEnter} onMouseLeave={onProfileLeave}
        />

        <button className="btn-danger" onClick={onLogout}>Sign out</button>
      </div>
    </nav>
  );
}