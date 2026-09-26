# Tasks Page (home)

**Route:** `/` · **Access:** 🔒 · **File:** `pages/TasksPage.jsx` · **Status:** ✅ built

## Purpose

The main screen: stat tiles at the top, then a task table (cards on smaller screens). From here the user can create a task (optionally with AI), filter by status and priority, sort, select rows for bulk actions, start/stop the timer, change status inline, and open a task's insights from the ⋯ menu.

## API

| Action          | Hook                    | Endpoint                          |
| --------------- | ----------------------- | --------------------------------- |
| All tasks (list + stat tiles) | `useTasks()` | `GET /api/tasks`                  |
| AI suggest      | `useAiSuggest()`        | `POST /api/tasks/ai-suggest`      |
| Create          | `useCreateTask()`       | `POST /api/tasks`                 |
| Change status   | `useUpdateTask()`       | `PATCH /api/tasks/:id { status }` |
| Delete          | `useDeleteTask()`       | `DELETE /api/tasks/:id`           |
| Bulk actions    | `useBulkTaskAction()`   | N × `PATCH` / `DELETE /api/tasks/:id` (see `ARCHITECTURE.md` → Bulk actions) |
| Active timer    | `useActiveTimer()`      | `GET /api/timelogs/active`        |
| Start / Stop    | `useStartTimer()` / `useStopTimer()` | `POST /api/tasks/:id/timer/start` / `stop` |

Invalidation follows the table in `ARCHITECTURE.md`.

**One task query:** the stat tiles describe **all** tasks and the list shows the filtered ones, both from the same cached list. Changing a filter makes no request.

## State

### Filters: the URL (`useSearchParams`)

```
?status=pending|in_progress|completed   (missing = 'all')
?priority=low|medium|high               (missing = 'all')
?sort=dueDate|priority                  (missing = 'newest')
```

Default values are removed from the URL, and unknown values fall back to the default so a bad link never reaches the API. Filters survive a reload and can be shared.

### Page UI state: `useState`

```
selectedIds: []        // row checkboxes; a bulk action keeps only the ids that failed
openMenuId: null       // task id whose ⋯ menu is open
insightsTaskId: null   // task id shown in the InsightsPanel (opening it closes the menu)
showCreateForm: false  // "New task" modal
confirm: null          // null | { type: 'delete', id } | { type: 'bulkDelete', ids }
```

Deleting a task closes the confirm, drops it from the selection and closes its panel if open. Notices are sonner toasts (`toast.success` / `toast.warning` / `toast.error`), so Task Detail can show "Task deleted." and navigate here without passing router state.

- Filtering and sorting happen in the browser (`visibleTasks()` in `TasksPage`), with the same rules as the API: due date earliest first with no-date last, priority high → low, ties keep newest first.
- **Changing a filter or sort clears the selection**, so a bulk action never touches rows the user can't see.
- **Stale selections:** after a refetch, a selected task may be gone (deleted in another tab). Compute `visibleSelectedIds = selectedIds.filter(id => visibleIds.has(id))` at render and act only on that. Don't sync it back into state.

### `TaskForm`: react-hook-form

```
defaultValues: { rawInput: '', title: '', description: '', priority: 'medium', dueDate: '' }
useState: step ('input' → 'review'), aiGenerated (true | false | null = not asked yet)
Suggest with AI → trigger('rawInput'), then setValue title/description, step = 'review'
Use as is       → title = rawInput, step = 'review'
Save            → handleSubmit with taskRules (utils/validation.js); API errors via setServerErrors
```

## Page Layout

```
Desktop (≥ 992px)
Tasks                                                     [ + New task ]
┌──────────────────────────────────────────┐ ┌──────────────────────────────────┐
│ ⚑ Low      │ ⚑ Medium    │ ⚑ High        │ │ Total task │ Total done │ Overdue │
│ 42         │ 64          │ 12            │ │ 120        │ 220        │ 28      │
└──────────────────────────────────────────┘ └──────────────────────────────────┘
[All] [Pending] [In progress] [Completed]          Priority [All ▾]
(bulk bar replaces this row while rows are selected)

☐ │ Task                │ Time tracked     │ Priority ↕ │ Status          │ Due date ↕  │ ⋯
☐ │ Classroom docs      │ 1h 05m   [▶]     │ ⚑ Medium   │ [Doing ▾] ⚠Overdue │ 10 Feb 2025 │ ⋯
☐ │ Progress update     │ ● 00:04:12 [■]   │ ⚑ High     │ [Doing ▾]       │ 10 Feb 2025 │ ⋯
```

### Stat tiles (`StatTiles`)

- Computed with `useMemo` from the **unfiltered** list using `utils/taskStats.js`:
  - Low / Medium / High = the count per `priority` across all tasks, so Low + Medium + High = Total.
  - Total = `tasks.length` · Done = `status === 'completed'` · Overdue = `isOverdue(task, todayLocal())`
- **Layout:** two groups, like the design. Each group is a card with 3 tiles in a row and a divider between tiles. The groups are stacked below 1200px and side by side from 1200px (CSS grid in `.stat-groups`). Numbers are 22px on phones and 28px from 768px.
- Tiles are **buttons** that apply a filter: Low/Medium/High → the priority filter, Done → the Completed tab, Total → clear filters. Overdue has no server filter, so it just scrolls to the list. (Don't fake an overdue filter on the client, because it would break the "no client re-sorting" rule and the selection rules.)
- While loading, show skeleton numbers and keep the tile labels.

### Filters

- **Status tabs** (pill buttons with `aria-pressed`, horizontally scrollable on mobile): `All · To do · Doing · Completed`. Labels come from `STATUS_LABELS` in `constants.js` (`pending → "To do"`, `in_progress → "Doing"`), as in the design. The API values don't change.
- **Priority select:** `All priorities · High · Medium · Low`
- **Sort:** clickable headers on desktop (see Table). Below 992px a select `Sort: Newest · Due date · Priority` sits next to the priority select, and it's hidden at ≥ 992px.
- **Errors from inline actions** (status change, Start/Stop 409, delete) go to a sonner toast through `notifyError` (`toast.error`), passed as a prop to the table/cards and the panel.

## Table (≥ 992px) — `TaskTable`

Render **either** the table or the cards, chosen with `useMediaQuery('(min-width: 992px)')`. Don't mount both and hide one with CSS: each row would get two ⋯ menus sharing `openMenuId`, and the hidden menu's outside-click handler would close the visible one.

| Column       | Content                                                                 | Sort |
| ------------ | ----------------------------------------------------------------------- | ---- |
| ☐            | Row checkbox. The header checkbox selects all visible rows (`indeterminate` when only some are selected) | – |
| Task         | Title (link to `/tasks/:id`, `text-break`), muted + strikethrough if completed | – |
| Time tracked | `totalTime` (+ live `elapsed` if running) and the `TimerButton` (▶ / ■, 36px icon button with `aria-label`) | – |
| Priority     | `PriorityBadge` (flag icon + text)                                      | `sort=priority` |
| Status       | `StatusSelect` styled as a pill, plus a red `⚠ Overdue` badge when overdue | – |
| Due date     | `DueDate` ("10 Feb 2025"), empty if none                                | `sort=dueDate` |
| ⋯            | `TaskRowMenu`                                                            | – |

- **Sortable headers** are only the ones the server can sort. Clicking Priority or Due date sets that sort. Clicking the active one again goes back to `newest`. Show ↕ on sortable headers, the active one highlighted, and `aria-sort` on the `<th>`.
- Row height 64px, hover background, and a selected row gets a tinted background.
- The table uses `table-layout: fixed` with the Task column taking the remaining space, so there's no horizontal scroll at 992px.

## Cards (< 992px) — `TaskCard`

```
┌──────────────────────────────────────┐
│ ☐  Follow up with UI Designer     ⋯  │
│    ⚑ High   [Doing ▾]   ⚠ Overdue    │
│    📅 10 Feb 2025                     │
│    ⏱ 1h 05m        ● 00:04:12  [■ Stop] │
└──────────────────────────────────────┘
```

- `col-12` → `col-md-6`. The checkbox has a 44px tap area. The title links to `/tasks/:id`.
- The description is not shown in the list (it's in insights and details).

## Row menu (⋯) — `TaskRowMenu`

A React-controlled dropdown (`openMenuId`): Bootstrap `dropdown-menu show` markup, closed on outside click / Esc / choosing an item.

| Item              | Action                                                    |
| ----------------- | --------------------------------------------------------- |
| 📊 Insights       | `OPEN_INSIGHTS { id }` → `InsightsPanel` ([08-task-insights.md](08-task-insights.md)) |
| ✎ Details & edit  | `navigate('/tasks/:id')`                                   |
| 🗑 Delete          | `ASK_DELETE { id }` → `ConfirmModal`                       |

On desktop the menu opens aligned right (`dropdown-menu-end`). Near the bottom of the viewport it opens upward.

## Bulk actions — `BulkActionBar`

Shown when `selected.length > 0`. It replaces the filter row, so the layout doesn't jump. Below 992px it's `position: sticky` at the bottom of the list (84px up when the timer bar is showing). On desktop it's static.

```
3 selected   [✓ Mark complete] [Status ▾] [Priority ▾] [🗑 Delete]   [✕ Clear]
```

| Action          | Requests                                 | Confirm |
| --------------- | ---------------------------------------- | ------- |
| Mark complete   | `PATCH { status: 'completed' }` for each | no      |
| Status ▾        | `PATCH { status }` for each              | no      |
| Priority ▾      | `PATCH { priority }` for each            | no      |
| Delete          | `DELETE` for each                        | **yes**: "Delete 3 tasks and all their time logs?" |

- Skip no-op requests (for example, don't PATCH tasks that already have that status). If nothing is left to change, clear the selection and say "Nothing to change: the selected tasks already have that value."
- **Result:** success → `CLEAR_SELECTION` + alert "3 tasks updated". Partial → `KEEP_SELECTED { ids: failedIds }` + a warning alert "2 updated, 1 failed: <message>".
- While it's pending, every bulk button is disabled and shows a spinner.
- If a completed or deleted task was the one with the running timer, the timer is **not** stopped by the server. Bulk delete invalidates `['timelogs']`, so the timer bar disappears. For "complete", the notice says "N tasks completed. The timer is still running on "<title>"."

## Create Task Flow (natural language + AI)

The **+ New task** button (top right, primary) sets `TOGGLE_CREATE_FORM` and opens `TaskForm` in a React-controlled modal (full-screen on mobile, `modal-dialog-centered` on desktop).

```
Step 1 (input)
  "What do you need to do?"  [ follow up with designer        ]
  [ ✨ Suggest with AI ]   [ Use as is ]

Step 2 (review, all fields editable)
  Title        [ Follow up with UI Designer             ]
  Description  [ Send a Slack message to confirm ...    ]
  Priority     [ Medium ▾ ]      Due date [ dd/mm/yyyy ]   ← optional
  (badge: "AI suggested" or "AI unavailable, edit manually")
  [ Back ]  [ Save task ]
```

- **Suggest with AI** calls ai-suggest with `{ input: rawInput }`.
  - If `aiGenerated: false`, still go to review with the title prefilled from the input, and show a small "AI unavailable" note.
- **Use as is** skips AI entirely.
- **Save** sends `{ title, description, rawInput, priority, dueDate }`. An empty due date input is sent as `dueDate: null` (or left out). The status defaults to `pending` on the server.
- On success: `RESET` the form, close the modal, show an alert "Task created".
- **Validation:** rawInput is required for step 1. The title is required (1–200 chars) and the description is optional (≤ 2000). Priority is one of low/medium/high (default medium). The due date is optional; a past date is allowed but show a small "This date is in the past" hint.

## Behaviour details

- **Total shown** = `task.totalTime` + (`elapsed` if this task is the running one)
- **StatusSelect** changes the status via PATCH. It's disabled while the mutation is pending.
- **TimerButton**:
  - this task is running → **Stop**
  - no timer running → **Start**
  - another task is running → **Start disabled** + tooltip/hint "Stop the running timer first"
- **Delete** → `ConfirmModal` ("Delete this task and all its time logs?") → mutation → `CANCEL_CONFIRM`. If the deleted task is open in the insights panel, close it.
- If the running task is deleted, the active timer query is refetched and the timer bar disappears.
- A completed task shows its title with muted styling, and its due date is never shown as overdue.
- No due date → the due date cell is empty (not "No due date").

## States

| State   | UI                                                        |
| ------- | --------------------------------------------------------- |
| Loading | Skeleton tiles + 5 skeleton rows (cards on mobile)         |
| Empty (all) | "No tasks yet." + **New task** button (opens the modal) |
| Empty (filter) | "No tasks match these filters." + a "Clear filters" button |
| Error   | ErrorAlert + Retry                                        |
| 409 on start | Alert "A timer is already running" + refetch active  |
| Bulk partial failure | Warning alert with the count, failed rows stay selected |

## Acceptance

- [ ] Stat tiles always reflect all tasks, even while a filter is active
- [ ] Clicking a tile applies the matching filter
- [ ] Table at ≥ 992px, cards below, and no horizontal scroll at 360px or at 992px
- [ ] The natural-language → AI → edit → save flow works, and works without AI too
- [ ] Filter tabs, priority filter and sort work together without a page reload
- [ ] Priority / Due date headers sort on the server; clicking again goes back to newest
- [ ] Select all / select some / clear works; changing a filter clears the selection
- [ ] Bulk complete / status / priority / delete work, delete asks first, partial failures are reported
- [ ] ⋯ → Insights opens the panel for that task; ⋯ → Delete asks for confirmation
- [ ] A due date picked as 30 Sep shows as 30 Sep (no timezone shift) and overdue tasks are marked
- [ ] Start on a pending task flips its status to "Doing" (server side effect + invalidation)
- [ ] Only one Start is enabled while a timer runs, and the live clock survives a refresh
