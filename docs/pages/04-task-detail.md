# Task Detail Page

**Route:** `/tasks/:id` · **Access:** 🔒 · **File:** `pages/TaskDetailPage.jsx` · **Status:** ✅ built

## Purpose

See and edit one task, control its timer, and view every session (time log) for it along with the total time.

## API

| Action         | Hook                         | Endpoint                          |
| -------------- | ---------------------------- | --------------------------------- |
| Load task      | `useTask(id)`                | `GET /api/tasks/:id`              |
| Task's logs    | `useTimeLogs({ taskId: id })`| `GET /api/timelogs?taskId=:id`    |
| Update         | `useUpdateTask()`            | `PATCH /api/tasks/:id`            |
| Delete task    | `useDeleteTask()`            | `DELETE /api/tasks/:id`           |
| Delete log     | `useDeleteTimeLog()`         | `DELETE /api/timelogs/:id`        |
| Start / Stop   | `useStartTimer()` / `useStopTimer()` | `.../timer/start` / `stop` |

## State

```
useForm({ defaultValues })     // edit form: title, description, status, priority, dueDate
useState: editing (false | true), confirm (null | { type: 'task' } | { type: 'log', id })
Edit     → reset(formValuesFrom(task)), editing = true   (the ONLY time query data is copied)
Save     → handleSubmit with taskRules; PATCH only changed fields; toast "Task saved."
Delete   → confirm; on success toast "Task deleted." and navigate to /
```

In view mode, the UI renders directly from the query data. In edit mode, it renders from the form.

## Layout (mobile first)

```
‹ Back to tasks
┌───────────────────────────────┐
│ Follow up with UI Designer     │
│ [In progress] [High]           │
│ 📅 Due 30 Sep (or "Overdue")   │  ← only if dueDate
│ Send a Slack message to ...    │
│ Original input: "follow up..." │  ← rawInput, muted, only if present
│ Created 26 Sep, 10:00          │
│ Completed 26 Sep, 16:20        │  ← only if completedAt
│ [Edit]                   [🗑]  │
├───────────────────────────────┤
│ Total time   1h 25m            │  ← totalTime + live elapsed if running
│ ● 00:04:12      [■ Stop]       │
├───────────────────────────────┤
│ Sessions (3)                   │
│ 26 Sep  10:00 → 10:25   25m 🗑 │
│ 26 Sep  11:00 → 11:40   40m 🗑 │
│ 26 Sep  15:10 → running  ●     │
└───────────────────────────────┘
```

- **Desktop (≥ 992px):** two columns. The task info and timer are on the left (`col-lg-5`), and sessions are on the right (`col-lg-7`).

## Insights section

Below the sessions list (full width, under both columns on desktop), render `<TaskInsights taskId={id} />`: stats, reminders, AI summary and charts. It's the same component as the Tasks page panel, without its header. See [08-task-insights.md](08-task-insights.md). It reuses the `['task', id]` and `['timelogs', { taskId }]` queries this page already loads, so there are no extra requests except the AI summary.

## Edit Form

- Fields: title (required, ≤ 200), description (≤ 2000), status select, priority select, due date (`<input type="date">` with a "Clear" link that sends `dueDate: null`)
- Send **only the changed fields** in the PATCH (`changedFields(values, task)`: trims the text, and an empty due date becomes `null`). If nothing changed, just leave edit mode.
- Client checks before saving: the title is required, and the due date must pass `isValidDateKey()` ("Enter a valid calendar date"). Server 400 `details` are mapped onto the fields with `fieldErrorsFrom()`.
- Status → `completed`: the server sets `completedAt`. Moving away from `completed` clears it. The UI re-reads it from the refreshed query.

## Sessions List

- Newest first (the API order). Each row: date, start → end (local time), duration (`formatDuration`).
- A running session shows "running" + a live clock and **no delete button**. Stop it first.
- Delete a session → `ConfirmModal` → mutation → total time updates.
- Empty: "No sessions yet. Press Start to track time."

## Navigation Cases

| Case                        | Behaviour                                              |
| --------------------------- | ------------------------------------------------------ |
| 404 (bad id / another user's task) | "Task not found" + a button back to Tasks        |
| Task deleted                | `navigate('/', { replace: true, state: { notice: 'Task deleted.' } })`; the Tasks page shows the notice |

## Acceptance

- [ ] Edits persist, and the list page reflects them without a manual refresh
- [ ] Total time = sum of finished sessions + the live running time
- [ ] Deleting a session updates the total immediately
- [ ] Opening another user's task id shows "not found", with no data leak
