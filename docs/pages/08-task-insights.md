# Task Insights (one task)

**Where:** `InsightsPanel` (opened from ⋯ → Insights on the Tasks page) and an **Insights** section on Task Detail · **Access:** 🔒
**Files:** `components/InsightsPanel.jsx`, `components/TaskInsights.jsx`, `components/ReminderList.jsx` (`TaskReminderList`), `components/AiSummaryCard.jsx`, `charts/*`, `utils/insightsData.js` · **Status:** ✅ built (the AI card waits on the backend endpoint)

## Purpose

Everything about one task in chart form: how much time went into it, when, in how many sessions, what's coming up (reminders), and an AI-written summary from the server.

## API

| Data            | Hook                          | Endpoint                               |
| --------------- | ----------------------------- | -------------------------------------- |
| Task            | `useTask(id)`                 | `GET /api/tasks/:id`                   |
| Task's sessions | `useTimeLogs({ taskId: id })` | `GET /api/timelogs?taskId=:id`         |
| Running timer   | `useActiveTimer()`            | `GET /api/timelogs/active`             |
| AI summary      | `useTaskInsights(id)`         | `GET /api/tasks/:id/insights?tzOffset=` ⚠ **backend to add**, see below |

- The charts depend only on the task and the time logs, so they render as soon as those load. The AI card loads on its own and never blocks the charts.
- `useTaskInsights` has `enabled: Boolean(id)`, `staleTime: 5 min`, `refetchOnWindowFocus: false`, and `retry: false` (the LLM is slow and costs money).

## Panel (`InsightsPanel`)

- Shown when `insightsTaskId !== null` (page `useState` on Tasks and `/insights`). It renders Bootstrap `offcanvas offcanvas-end show` markup + a backdrop, controlled by React.
- Props: `taskId`, `onClose`, `onMissing` (the task is gone → the page closes the panel and shows "That task no longer exists."), and `notifyError` (Start/Stop errors go to the page notice).
- The header shows a "TASK INSIGHTS" eyebrow + the title, then priority, status, overdue and due date, the description, **Start/Stop**, and **Details & edit ›**.
- **Width:** full screen below 768px, 480px at ≥ 768px, 560px at ≥ 1200px.
- **Closes on:** ✕, backdrop click, Esc. Focus moves into the panel on open and back to the ⋯ button on close.
- If the task gets deleted (404 from `useTask`) → close the panel and show an alert "Task no longer exists".

## Layout

```
┌───────────────────────────────────────────┐
│ Follow up with UI Designer             ✕  │
│ ⚑ High   [Doing]   📅 Due 30 Sep          │
│ [▶ Start] / [■ Stop 00:04:12]  [Details ›] │
├───────────────────────────────────────────┤
│ 1h 25m   │ 6        │ 14m      │ 40m      │
│ total    │ sessions │ avg      │ longest  │  ← 2×2 on mobile, 1×4 at ≥ 480px panel
├───────────────────────────────────────────┤
│ 🔔 Reminders                               │
│  ⚠ Overdue by 2 days                       │
│  💤 No time tracked in 4 days              │
├───────────────────────────────────────────┤
│ ✨ AI summary                   [↻ Regenerate] │
│  You've spent 1h 25m across 6 sessions...  │
│  • Tip: block 30 min tomorrow morning      │
├───────────────────────────────────────────┤
│ [7 days] [30 days]                         │
│ Tracked time per day   (bar)               │
│ ▁ ▃ ▇ ▂ ▁ ▅ ▆                              │
│ Time by weekday        (doughnut: Mon–Sun) │
│ Sessions (last 10)     (bar)               │
└───────────────────────────────────────────┘
```

On Task Detail, the same `TaskInsights` component renders below the sessions list, without the header row (the page already shows it).

## Stats row

Computed with `useMemo` from the logs (a running log counts `now − startTime`):

| Stat     | Formula                                        |
| -------- | ---------------------------------------------- |
| Total    | `task.totalTime + elapsed` (same as the list)  |
| Sessions | `logs.length`                                  |
| Avg      | finished logs: `sum(duration) / count`          |
| Longest  | `max(duration)` of finished logs               |

## Charts (`utils/insightsData.js`, all pure, `now` passed in)

| Chart | Type | Data |
| ----- | ---- | ---- |
| **Tracked time per day** | Bar | `secondsPerDay(logs, days, now)` → the last 7 or 30 local days ending today (from the range switch). Labels "Mon 22" for 7 days, "22 Sep" for 30. Y axis in minutes up to 2h, then in hours |
| **Time by weekday** | Doughnut | `secondsByWeekday(perDay)`: the same per-day totals added up Mon → Sun, so it follows the range switch |
| **Sessions (last 10)** | Bar | the newest 10 logs, oldest → newest, label "22 Sep 10:00", value = duration in minutes. The running one uses the elapsed time and a striped/lighter color. Not affected by the range switch |

- **Range switch** (`[7 days] [30 days]`, local `useState`, default 7 days) uses the same `RANGES` from `utils/constants.js` and the same pill buttons as the Insights page. No time in the range → both range charts show "No time tracked in the last 7 days."

- A session that crosses midnight is counted on the day it **started**. That matches the backend summary, which groups by `startTime`.
- Bar color = the task's priority color (`--priority-high`, …) so the panel feels tied to the task. The weekday doughnut uses 7 fixed colors (`chartColors().weekdays`).
- No logs → the stats show `0` / `–` and the charts are replaced by one empty state: "No time tracked yet. Press Start to begin."
- Values are plotted in **minutes** (`toMinutes`). Axis ticks use `minutesTick` ("45m", then "2h"), and tooltips use `minutesTooltip` (`formatDuration`).
- `now` comes from `useNow(30_000)` while this task's timer runs, so charts refresh every 30s. The Total stat ticks every second through `useElapsed`.

## Reminders (`ReminderList`, derived on the client, no backend)

Built by `buildTaskReminders(task, logs, todayLocal(), now)`, in this priority order:

| Condition (task not completed)                                  | Reminder                          | Style   |
| --------------------------------------------------------------- | --------------------------------- | ------- |
| `dueDate < today`                                               | "Overdue by N days"               | danger  |
| `dueDate === today`                                             | "Due today"                       | warning |
| `dueDate` within the next 3 days                                | "Due in N days"                   | info    |
| `status === 'in_progress'` and no log in the last 3 days        | "No time tracked in N days"       | muted   |
| `priority === 'high'` and `status === 'pending'` and no logs    | "High priority and not started yet" | warning |
| task completed                                                  | "Completed on 26 Sep" (only this) | success |

- Day differences are computed on `"YYYY-MM-DD"` strings via `new Date(y, m - 1, d)`, **never** `new Date("YYYY-MM-DD")` (see `ARCHITECTURE.md` → due dates).
- These are **in-app reminders only**. There are no push or email notifications.
- None apply → "Nothing needs attention 🎉".

## AI summary (`AiSummaryCard`)

| State                     | UI                                                      |
| ------------------------- | ------------------------------------------------------- |
| loading                   | 3 skeleton lines + "Generating summary…"                |
| `aiGenerated: true`       | `summary` paragraph + `tips` as a list + small "AI generated" label |
| `aiGenerated: false`      | "AI summary unavailable right now." + Regenerate        |
| error 404 (endpoint missing) | "AI insights aren't set up on the server yet." + Regenerate |
| error (network/500/429)   | the message + Regenerate. 429 → "Too many requests, try again in a minute." |

- **Regenerate** = `refetch()`. It's disabled while `isFetching`.
- The text is rendered as **plain text** (`{summary}`), never with `dangerouslySetInnerHTML`, because LLM output is untrusted.

## Backend contract needed (proposal, the backend team owns the final shape)

```
GET /api/tasks/:id/insights?tzOffset=-330        🔒
200 → { "success": true, "data": {
          "taskId": "...",
          "summary": "You've spent 1h 25m on this task across 6 sessions...",
          "tips": ["Block 30 minutes tomorrow morning", "..."],
          "aiGenerated": true
        } }
404 → task not found / not owned
429 → rate limited
```

- The server gathers the task + its time logs, builds the prompt and calls the LLM. The key stays in the server `.env`.
- If the LLM fails or isn't configured → `200` with `aiGenerated: false`, `summary: ""`, `tips: []` (same pattern as `ai-suggest`).
- Suggested: a per-user rate limit (e.g. 10/min) and a timeout (~15s) on the LLM call.

## Acceptance

- [ ] ⋯ → Insights opens the panel for the right task; Esc/backdrop/✕ close it
- [ ] Charts show and are correct without waiting for the AI summary
- [ ] A running timer shows up live in the total and in today's bar
- [ ] A due date of today shows "Due today" in every timezone
- [ ] The AI card handles success, `aiGenerated: false`, and errors, and Regenerate works
- [ ] Full-screen and usable at 360px
