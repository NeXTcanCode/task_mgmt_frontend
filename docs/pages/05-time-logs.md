# Time Logs Page

**Route:** `/timelogs` · **Access:** 🔒 · **File:** `pages/TimeLogsPage.jsx` · **Status:** ⏳ not built yet (the route currently shows 404, and there's no sidebar link yet)

> When building: reuse `useTimeLogs`, `useDeleteTimeLog`, `useElapsed`, `formatDuration`/`formatDate`, `ConfirmModal`, sonner `toast`, and the `.app-shell` styles in `app.css`. Add `{ to: '/timelogs', label: 'Time Logs', icon: 'clock' }` to `LINKS` in `Sidebar.jsx`.

## Purpose

View **all** time tracking sessions across tasks, filter them by date range or task, and delete mistakes.

## API

| Action          | Hook                                  | Endpoint                                   |
| --------------- | ------------------------------------- | ------------------------------------------ |
| List logs       | `useTimeLogs({ taskId, from, to })`   | `GET /api/timelogs?taskId=&from=&to=`      |
| Tasks (for the filter dropdown) | `useTasks()`          | `GET /api/tasks`                           |
| Delete log      | `useDeleteTimeLog()`                  | `DELETE /api/timelogs/:id`                 |

`from`/`to` are sent as ISO strings. The date inputs give `YYYY-MM-DD` in local time, so convert them:
- `from` = the start of that local day, `new Date('YYYY-MM-DDT00:00:00').toISOString()`
- `to` = the end of that local day (`T23:59:59.999`)

## Reducer: `timeLogsReducer`

```
state = {
  filters: { range: 'today', from: '', to: '', taskId: '' },
  confirmDeleteId: null
}
actions:
  SET_RANGE    { range }   // 'today' | 'week' | 'all' | 'custom'
  SET_DATE     { name: 'from'|'to', value }
  SET_TASK     { taskId }
  CLEAR_FILTERS
  ASK_DELETE { id } | CANCEL_DELETE
```

The quick ranges are turned into `from`/`to` in the component (not the reducer, which stays pure; no `Date.now()`):
- **today**: from the start of today
- **week**: from 6 days ago at the start of that day
- **all**: no dates

## Layout (mobile first)

```
Time Logs
[Today] [7 days] [All] [Custom]      ← pills, scroll horizontally
(custom → From [date] To [date])
Task [All tasks ▾]
Total: 3h 10m · 7 sessions

── Sat, 26 Sep ─────────────  2h 05m
│ Follow up with UI Designer        │
│ 10:00 → 10:25          25m    🗑  │
│ Design review                     │
│ 11:00 → running        ● 00:12:40 │
── Fri, 25 Sep ─────────────  1h 05m
│ ...                               │
```

- Group by **local date** (`startTime`), with a subtotal per day.
- **Mobile:** stacked cards (`TimeLogItem`).
- **Desktop (≥ 768px):** a Bootstrap `table table-hover` with the columns Task · Date · Start · End · Duration · (delete).
- The task title links to `/tasks/:taskId`.
- The running log shows a live clock, and deleting it is disabled.

## Totals

- **Total** = the sum of `duration` for the visible logs, + the live elapsed time of a running one.
- The session count is the number of visible logs.

## States

| State  | UI                                                   |
| ------ | ---------------------------------------------------- |
| Loading | Spinner                                             |
| Empty  | "No sessions in this period." + a link to Tasks        |
| Error  | ErrorAlert + Retry                                   |

## Acceptance

- [ ] The default view shows today's sessions
- [ ] The task filter and date range combine correctly
- [ ] Deleting a log updates the list, the totals, the task totals and the summary
- [ ] Times display in the user's local timezone
