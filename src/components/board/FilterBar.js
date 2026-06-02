import React from "react";

const ACCENT = "#0d9488"; // Brand Teal

const LABEL_COLORS = [
  { id: "red",    bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444", name: "Bug"      },
  { id: "amber",  bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", name: "Feature"  },
  { id: "green",  bg: "#dcfce7", text: "#166534", dot: "#22c55e", name: "Improve"  },
  { id: "blue",   bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6", name: "Docs"     },
  { id: "purple", bg: "#ede9fe", text: "#5b21b6", dot: "#8b5cf6", name: "Design"   },
  { id: "pink",   bg: "#fce7f3", text: "#9d174d", dot: "#ec4899", name: "Research" },
];

const PRIORITY_CONFIG = {
  low:      { label: "Low",    color: "#22c55e", bg: "#dcfce7", text: "#166534" },
  medium:   { label: "Medium", color: "#f59e0b", bg: "#fef3c7", text: "#92400e" },
  high:     { label: "High",   color: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
  critical: { label: "🔥",     color: "#7c3aed", bg: "#ede9fe", text: "#5b21b6" },
};

function FilterBar({ search, setSearch, filterLabel, setFilterLabel, filterAssignee, setFilterAssignee, filterPriority, setFilterPriority, allAssignees, onClear }) {
  const hasFilter = search || filterLabel || filterAssignee || filterPriority;
  return (
    <div style={{ 
      display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", 
      padding: "16px 32px", background: "white", 
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" 
    }}>
      <div style={{ position: "relative", flex: "1 1 250px", minWidth: 200 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search cards..."
          style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#f8fafc", transition: "0.2s" }}
          onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "white"; }}
          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
        />
      </div>
      
      <div style={{ display: "flex", gap: 12 }}>
        <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", background: "#f8fafc", color: filterLabel ? "#0f172a" : "#64748b", outline: "none", cursor: "pointer", transition: "0.2s" }}
          onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
          <option value="">All Labels</option>
          {LABEL_COLORS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", background: "#f8fafc", color: filterPriority ? "#0f172a" : "#64748b", outline: "none", cursor: "pointer", transition: "0.2s" }}
          onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label} {k}</option>)}
        </select>
        {allAssignees.length > 0 && (
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
            style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", background: "#f8fafc", color: filterAssignee ? "#0f172a" : "#64748b", outline: "none", cursor: "pointer", transition: "0.2s" }}
            onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
            <option value="">All Assignees</option>
            {allAssignees.map(a => <option key={a} value={a}>{a.split("@")[0]}</option>)}
          </select>
        )}
      </div>
      
      {hasFilter && (
        <button onClick={onClear} style={{ padding: "10px 16px", background: "white", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "0.2s" }}
        onMouseEnter={e => e.target.style.background = "#fef2f2"} onMouseLeave={e => e.target.style.background = "white"}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export default FilterBar;