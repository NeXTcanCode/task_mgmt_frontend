# Daily Summary Page

**Route:** `/summary` · **Access:** 🔒 · **File:** `pages/SummaryPage.jsx` · **Status:** ⏳ not built yet (the route currently shows 404, and there's no sidebar link yet)

> When building: add `api/summary.js` + `hooks/useSummary.js` (key `['summary', 'today']`; mutations already invalidate `['summary']`). Reuse `PriorityBadge`, `StatusBadge`, `formatDuration`, and the `.kpi-row` / `.insight-card` styles. Add `{ to: '/summary', label: 'Today', icon: 'calendar' }` to `LINKS` in `Sidebar.jsx`.

## Purpose

Today's productivity at a glance: time tracked, tasks worked on, completed today, and what's still open.

## API

| Action        | Hook                | Endpoint                                   |
| ------------- | ------------------- | ------------------------------------------ |
| Load summary  | `useTodaySummary()` | `GET /api/summary/today?tzOffset=<offset>` |

- `tzOffset = new Date().getTimezoneOffset()` (e.g. India = `-330`)
- **The server includes a running timer up to "now"** in `totalTrackedSeconds` and `trackedSeconds`. While a timer is running, set `refetchInterval: 30_000` so the numbers keep moving. Otherwise, don't poll.

## Response Used

```
date, totalTrackedSeconds,
tasksWorkedOn[{ id, title, status, trackedSeconds }],
completedToday[{ id, title, completedAt }],
inProgress[{ id, title, priority, dueDate }],
pending[{ id, title, priority, dueDate }],
overdue[{ id, title, priority, dueDate }],     // not completed, due before today
dueToday[{ id, title, priority, dueDate }]     // not completed, due today
```

## Reducer

Not needed. This page is read-only and all of its data comes from the query. (That's the correct choice: don't add a reducer just for the sake of it.)

## Layout (mobile first)

```
Today · Sat, 26 Sep

┌────────────┐┌────────────┐
│  3h 10m    ││     2      │
│  tracked   ││ completed  │
└────────────┘└────────────┘
┌────────────┐┌────────────┐
│     4      ││     5      │
│ worked on  ││ open tasks │   ← inProgress + pending
└────────────┘└────────────┘

⚠ Overdue (2)                 ← only if overdue.length; red border card
  • Send invoice   [High]   due 20 Sep
Due today (1)                 ← only if dueToday.length
  • Write README   [Low]

Tasks worked on today
  Design review   [In progress]   1h 40m  ████████░░
  Follow up...    [Completed]     0h 25m  ██░░░░░░░░

Completed today
  ✓ Follow up with UI Designer        16:20

In progress (2)            Pending (3)
  • Design review            • Write README
  • ...                      • ...
```

- **Stat cards:** `col-6` on mobile (2×2) → `col-md-3` (1×4) on desktop.
- **Worked-on rows:** each progress bar = `trackedSeconds / totalTrackedSeconds` (Bootstrap `progress`), sorted by time, highest first.
- **In progress / Pending:** stacked on mobile, side by side (`col-md-6`) on desktop.
- **Overdue / Due today** sit above "Tasks worked on today" so they're the first thing seen. Each row shows `PriorityBadge`; overdue rows show the due date. Hide each block when its list is empty.
- Every task title links to `/tasks/:id`.

## States

| State  | UI                                                              |
| ------ | --------------------------------------------------------------- |
| Loading | Spinner                                                        |
| Nothing today | Stat cards show 0 + "No time tracked yet today. Start a timer from Tasks." |
| Error  | ErrorAlert + Retry                                              |

## Bonus (only if time is left)

- A simple bar chart of time per task (CSS bars are enough, no library needed)
- A weekly view: reuse the time logs API with a 7-day range and group by day

## Acceptance

- [ ] "Today" matches the user's local date, not UTC
- [ ] Completing a task elsewhere moves it into "Completed today"
- [ ] A running timer's time counts toward today's total
- [ ] Overdue and due-today lists match the user's local date, and disappear when the task is completed
- [ ] Works at 360px width
