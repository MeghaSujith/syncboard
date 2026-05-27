# SyncBoard — Firebase Data Model

## Structure

syncboard-rtdb/
└── board/
├── cards/
│   ├── card-1/
│   │   ├── id: "card-1"
│   │   └── text: "Design the UI"
│   ├── card-2/
│   │   ├── id: "card-2"
│   │   └── text: "Set up Firebase"
│   └── card-{timestamp}/
│       ├── id: "card-{timestamp}"
│       └── text: "User created card"
├── columns/
│   ├── todo/
│   │   ├── id: "todo"
│   │   ├── title: "To Do"
│   │   └── cardIds: ["card-1", "card-2"]
│   ├── inprogress/
│   │   ├── id: "inprogress"
│   │   ├── title: "In Progress"
│   │   └── cardIds: ["card-3"]
│   └── done/
│       ├── id: "done"
│       ├── title: "Done"
│       └── cardIds: []
└── columnOrder: ["todo", "inprogress", "done"]

## Explanation

### Cards
Each card is stored as an object with a unique ID and text content.
New cards use `Date.now()` as their ID to ensure uniqueness.

### Columns
Each column stores its own ID, display title, and an ordered list
of card IDs it contains. The order of cardIds determines the 
visual order of cards in that column.

### columnOrder
An array that determines the left-to-right order of columns 
on the board.

## Real-Time Sync
All changes (card moves, additions, deletions) are written to 
Firebase using `set()`. All connected clients listen using 
`onValue()` and re-render instantly when data changes.

