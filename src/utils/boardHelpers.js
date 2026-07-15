// --- BOARD.JS HELPERS ---
export const ACCENT = "#0d9488";
export const COLUMN_COLORS = {
  todo:       { theme: "#8b5cf6", bg: "#e2e8f0" },
  inprogress: { theme: "#f59e0b", bg: "#e2e8f0" },
  review:     { theme: "#0ea5e9", bg: "#e2e8f0" },
  done:       { theme: "#10b981", bg: "#e2e8f0" },
};
export const defaultColumns = {
  todo:       { id: "todo",       title: "To Do",       cardIds: [] },
  inprogress: { id: "inprogress", title: "In Progress", cardIds: [] },
  review:     { id: "review",     title: "In Review",   cardIds: [] },
  done:       { id: "done",       title: "Done",        cardIds: [] },
};
export const LABEL_COLORS = [
  { id: "red",    bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444", name: "Bug"      },
  { id: "amber",  bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", name: "Feature"  },
  { id: "green",  bg: "#dcfce7", text: "#166534", dot: "#22c55e", name: "Improve"  },
  { id: "blue",   bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6", name: "Docs"     },
  { id: "purple", bg: "#ede9fe", text: "#5b21b6", dot: "#8b5cf6", name: "Design"   },
  { id: "pink",   bg: "#fce7f3", text: "#9d174d", dot: "#ec4899", name: "Research" },
];
export const BOARD_BACKGROUNDS = [
  { id: "default", bg: "#f8fafc", name: "Clean Slate" },
  { id: "dark", bg: "#0f172a", name: "Midnight" },
  { id: "blue", bg: "linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)", name: "Ocean Breeze" },
  { id: "purple", bg: "linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%)", name: "Amethyst" },
  { id: "teal", bg: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)", name: "Minty Fresh" }
];
export const PRIORITY_CONFIG = {
  low:      { label: "Low",    color: "#22c55e", bg: "#dcfce7", text: "#166534" },
  medium:   { label: "Medium", color: "#f59e0b", bg: "#fef3c7", text: "#92400e" },
  high:     { label: "High",   color: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
  critical: { label: "🔥",     color: "#7c3aed", bg: "#ede9fe", text: "#5b21b6" },
};

export function fixData(raw) {
  const fixed = { ...raw };
  if (fixed.columnOrder && !Array.isArray(fixed.columnOrder))
    fixed.columnOrder = Object.values(fixed.columnOrder);
  if (fixed.columns) {
    Object.keys(fixed.columns).forEach(colId => {
      const col = fixed.columns[colId];
      if (col.cardIds && !Array.isArray(col.cardIds)) col.cardIds = Object.values(col.cardIds);
      else if (!col.cardIds) col.cardIds = [];
    });
  }
  return fixed;
}

export function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function getPriority(card) {
  return card.priority || "medium";
}

// --- BOARDS.JS (DASHBOARD) HELPERS ---
export const BOARD_GRADIENTS = [
  "linear-gradient(135deg, #0d9488, #0ea5e9)",
  "linear-gradient(135deg, #8b5cf6, #6366f1)",
  "linear-gradient(135deg, #f59e0b, #f97316)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "linear-gradient(135deg, #10b981, #0d9488)",
  "linear-gradient(135deg, #f97316, #ef4444)",
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #0d9488, #10b981)",
];

export const AVATAR_COLORS = [
  "#0d9488", // teal
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#ec4899", // pink
];

// Deterministic color per person: the same email always maps to the same
// color, everywhere it's rendered — so "M" for Megha looks identical on
// every board card and in the top-nav, instead of every avatar defaulting
// to the same shade of teal.
export function getAvatarColor(identifier) {
  if (!identifier) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(nameStr) {
  if (!nameStr) return "??";
  if (nameStr.includes("@")) return nameStr.charAt(0).toUpperCase();
  const parts = nameStr.trim().split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return nameStr.substring(0, 2).toUpperCase();
}

export function getBoardGradient(id) {
  const idx = id ? id.charCodeAt(id.length - 1) % BOARD_GRADIENTS.length : 0;
  return BOARD_GRADIENTS[idx];
}

export function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getPendingTasks(boards, userEmail) {
  const pendingTasks = [];
  boards.forEach(b => {
    const doneIds = b.data?.columns?.done?.cardIds || [];
    const cards = b.data?.cards || {};
    Object.values(cards).forEach(c => {
      if (c.assignee === userEmail && !doneIds.includes(c.id)) pendingTasks.push({ boardName: b.name, ...c });
    });
  });
  return pendingTasks;
}

export function getUrgentTasks(boards) {
  const urgentTasks = [];
  const now = Date.now();
  boards.forEach(b => {
    const doneIds = b.data?.columns?.done?.cardIds || [];
    const cards = b.data?.cards || {};
    Object.values(cards).forEach(c => {
      if (doneIds.includes(c.id) || !c.dueDate) return;
      const dueTime = new Date(c.dueDate).getTime();
      if (dueTime < now || (dueTime - now) < 172800000) urgentTasks.push({ boardName: b.name, ...c });
    });
  });
  return urgentTasks;
}

export function computeBoardStats(boards, userEmail) {
  let pending = 0;
  let urgent = 0;
  const now = Date.now();
  const fortyEightHours = 48 * 60 * 60 * 1000;
  boards.forEach(board => {
    const cards = board.data?.cards || {};
    const doneIds = board.data?.columns?.done?.cardIds || [];
    Object.values(cards).forEach(card => {
      if (doneIds.includes(card.id)) return;
      if (card.assignee === userEmail) pending++;
      if (card.dueDate) {
        const dueTime = new Date(card.dueDate).getTime();
        if (dueTime < now || (dueTime - now) < fortyEightHours) urgent++;
      }
    });
  });
  return { pending, urgent };
}

export function sortBoardsByDeadline(boards) {
  return [...boards].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
}

export function getDeadlineBadge(board) {
  if (!board.dueDate) return { bg: "#f1f5f9", text: "#64748b", icon: "📅", label: "No deadline" };
  const daysLeft = Math.ceil((new Date(board.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { bg: "#fee2e2", text: "#b91c1c", icon: "🔥", label: `Overdue by ${Math.abs(daysLeft)}d` };
  if (daysLeft <= 2) return { bg: "#fef3c7", text: "#b45309", icon: "⚠️", label: `Due in ${daysLeft}d` };
  return { bg: "#dcfce7", text: "#15803d", icon: "✅", label: `${daysLeft}d left` };
}