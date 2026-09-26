# Insights Page (all tasks)

**Route:** `/insights` · **Access:** 🔒 · **File:** `pages/InsightsPage.jsx` · **Status:** ✅ built (the AI card waits on the backend endpoint)

## Purpose

Productivity across **all** tasks for the last 7 or 30 days: tracked time per day, where the time went, what got completed, status and priority breakdowns, reminders, and an AI-written weekly/monthly summary from the server.

## API

| Data               | Hook                                   | Endpoint                                      |
| ------------------ | -------------------------------------- | --------------------------------------------- |
| All tasks          | `useTasks()`                           | `GET /api/tasks`                              |
| Logs in range      | `useTimeLogs({ from })`                | `GET /api/timelogs?from=<ISO>`                |
| Running timer      | `useActiveTimer()`                     | `GET /api/timelogs/active`                    |
| AI summary         | `useInsights(range)`                   | `GET /api/insights?tzOffset=&range=week\|month` ⚠ **backend to add**, see below |

- `from` = local midnight `N − 1` days ago (N = 7 or 30), turned into ISO. It's built from `todayLocal()`, so it's **stable for the whole day**. Never build it from `Date.now()` in the query key, or the key changes every render and refetches forever.
- There's no `to`, so a running session is included.

## State: `useState`

```
rangeKey: 'week'        // 'week' (7 days) | 'month' (30 days)
insightsTaskId: null    // clicking a task in a chart or a reminder opens its InsightsPanel
```

Errors from the panel (e.g. timer 409) and "That task no longer exists." are sonner toasts.

## Layout (mobile first)

```
Insights                              [7 days] [30 days]

┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│ 12h 40m  ││ 1h 49m   ││ 9        ││ 64%      ││ 3        │
│ tracked  ││ daily avg││ completed││ done rate││ overdue  │
└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
   ← col-6 on mobile (last one full width), col-lg on desktop (1×5)

┌─ ✨ AI summary ─────────────── [↻] ┐ ┌─ 🔔 Reminders ─────────────┐
│ This week you tracked 12h 40m...   │ │ ⚠ 3 overdue                 │
│ • Tip ...                          │ │ 📅 2 due today              │
└────────────────────────────────────┘ │ ⏳ 4 due in the next 3 days  │
                                       └─────────────────────────────┘
┌─ Tracked time per day (bar) ───────┐ ┌─ Time by task (doughnut) ──┐
└────────────────────────────────────┘ └─────────────────────────────┘
┌─ Completed per day (line) ─────────┐ ┌─ Status (doughnut) ────────┐
└────────────────────────────────────┘ └─────────────────────────────┘
┌─ Priority: open vs done (stacked bar) ─────────────────────────────┐
└────────────────────────────────────────────────────────────────────┘
```

- **KPIs** (`.kpi-row`): 2 columns on phones with the last tile full width, and 5 in a row from 768px.
- **Grid:** every card is `col-12` on mobile. On desktop the AI summary is `col-lg-7` and the reminders are `col-lg-5`, the four charts are `col-lg-6`, and the priority chart is full width (`col-12`).
- All chart data comes from one `useMemo` (`useOverview(tasks, logs, days, now)`). `now` ticks every 30s only while a timer is running.

## KPIs (`useMemo`)

| KPI         | Formula                                                              |
| ----------- | -------------------------------------------------------------------- |
| Tracked     | sum of log seconds in range (running = `now − startTime`)             |
| Daily avg   | tracked / N days                                                     |
| Completed   | tasks with `completedAt` inside the range (local days)               |
| Done rate   | completed tasks / all tasks, as %; `–` when there are no tasks        |
| Overdue     | `countOverdue(tasks, todayLocal())` (same helper as the stat tiles)   |

## Charts

| Chart | Type | Data (`utils/insightsData.js`) |
| ----- | ---- | ------------------------------ |
| Tracked time per day | Bar | `secondsPerDay(logs, { days: N, now })`. With 30 days, label every 5th day |
| Time by task | Doughnut | `secondsByTask(logs)`: top 5 + "Other". **Clicking a slice → `OPEN_INSIGHTS { id }`** (not "Other"). The legend lists the title + duration |
| Completed per day | Line (filled) | `completedPerDay(tasks, { days: N, today })` from `completedAt` |
| Status | Doughnut | counts of `pending` / `in_progress` / `completed` (labels "To do / Doing / Completed") + overdue shown in the caption |
| Priority: open vs done | Stacked bar | for low/medium/high: open count vs completed count |

- Colors: status and priority colors come from the same CSS variables as the badges.
- Every chart has a `<figcaption>` with the key fact ("Most time went to *Design review*: 4h 10m").
- No logs in range → the time charts show the empty state "No time tracked in the last 7 days", while the task charts still show.

## Reminders (client-derived)

`buildOverviewReminders(tasks, logs, todayLocal())`. Each row is a count; clicking it expands the task list (title + due date, link → opens the panel):
- ⚠ **Overdue**: not completed, `dueDate < today`, oldest first
- 📅 **Due today**
- ⏳ **Due in the next 3 days**
- 💤 **Stalled**: `in_progress` with no log in the range

## AI summary

Same `AiSummaryCard` as the task panel (states, Regenerate, plain-text rendering, 429 message). Title: "This week" or "Last 30 days". Changing the range changes the query key, so each range is cached separately.

## Backend contract needed (proposal, the backend team owns the final shape)

```
GET /api/insights?tzOffset=-330&range=week        🔒   (range: week | month, default week)
200 → { "success": true, "data": {
          "range": "week",
          "from": "2026-09-20",
          "to": "2026-09-26",
          "summary": "This week you tracked 12h 40m across 8 tasks...",
          "tips": ["Two high-priority tasks are overdue ...", "..."],
          "aiGenerated": true
        } }
400 → bad range / tzOffset
429 → rate limited
```

- The server computes the stats for the range (it can reuse `dayRange` + the summary queries), builds the prompt and calls the LLM. The key never leaves the server.
- LLM failure → `200` with `aiGenerated: false`, `summary: ""`, `tips: []`.
- Suggested: a per-user rate limit and a ~15s timeout.

## States

| State   | UI                                                            |
| ------- | ------------------------------------------------------------- |
| Loading | Skeleton KPI tiles + skeleton chart boxes (fixed heights, so no layout jump) |
| No tasks at all | EmptyState "Create a few tasks and track time to see insights" + link to Tasks |
| Error (tasks/logs) | ErrorAlert + Retry (the AI card has its own error state) |

## Acceptance

- [ ] 7 / 30 day switch updates KPIs, charts and the AI summary
- [ ] Days are the user's local days; a session started at 23:30 counts on that day
- [ ] Clicking a task slice opens that task's insights panel
- [ ] Charts render without waiting for the AI summary; AI failure doesn't break the page
- [ ] Usable at 360px, no horizontal scroll, charts readable
