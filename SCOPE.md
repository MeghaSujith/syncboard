# SyncBoard — Scope Document
**Intern:** Megha Koottala  
**Internship:** 4Labs | 26 May – 04 July 2026  
**Project:** SyncBoard — Real-Time Collaborative Kanban Board

---

## What SyncBoard Does
SyncBoard is a real-time collaborative Kanban board where multiple users 
can manage tasks together and see each other's changes live without 
refreshing the page.

---

## Core Features (Must Have)
- 3-column Kanban board: To Do, In Progress, Done
- Add, edit, and delete cards — all syncing live across tabs
- Drag and drop cards between columns
- Real-time sync using Firebase Realtime Database
- User authentication — register and login with email and password
- Protected board — only logged-in users can access
- Python weekly digest script — emails a summary of board activity

---

## Should Have Features
- Card detail panel — description, due date, assignee
- User presence indicators — show who is viewing the board
- Board sharing — invite collaborators by email
- Responsive layout — works on tablet and desktop

---

## Out of Scope (Not Building)
- Mobile app
- Multiple boards per user
- File attachments on cards
- Notifications

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Real-time Database | Firebase Realtime Database |
| Authentication | Firebase Auth |
| Backend API | Node.js + Express |
| Python Layer | Python 3 + Firebase Admin SDK |
| Email | Python smtplib (Gmail SMTP) |
| Version Control | Git + GitHub |

---

## Milestones
| Milestone | Day | Goal |
|-----------|-----|------|
| M1 — Setup & Scope | Day 5 | Dev environment ready, scope approved |
| M2 — Live Sync Working | Day 10 | Real-time sync across 2 tabs |
| M3 — Joint Demo | Day 15 | Add, edit, delete cards working live |
| M4 — Auth | Day 20 | Login/logout working |
| M5 — Python Digest | Day 23 | Weekly email digest working |
| M6 — Polish | Day 25 | UI complete, responsive |
| M7 — Docs | Day 26 | README and setup guide done |
| M8 — Final Demo | Day 30 | Full live demo delivered |
