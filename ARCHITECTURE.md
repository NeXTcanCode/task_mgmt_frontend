# Frontend Architecture

A production-grade React single-page application for task and time tracking, demonstrating modern frontend patterns, state management best practices, and mobile-first design. This document outlines the technical architecture and key design decisions.

## Tech Stack

| Concern          | Choice                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| Build & Bundling | Vite (fast HMR, optimized production builds)                                   |
| UI Framework     | React 18 (pinned versions for stability)                                       |
| Routing          | react-router-dom v6 (dynamic route guards, deep linking support)               |
| Server State     | TanStack Query v5 (intelligent caching, automatic refetching, dev tools)       |
| Forms & Validation | react-hook-form with custom validation rules                                   |
| Notifications    | sonner toast library (user-friendly feedback)                                  |
| State Management | Composable: URL state (filters), React hooks (UI), TanStack Query (server data) |
| Styling          | Bootstrap 5 (CSS framework) + vanilla CSS with design tokens                  |
| Data Visualization | Chart.js v4 + react-chartjs-2 (performance, accessibility)                    |
| HTTP Client      | Native fetch API with request/response interceptors                            |
| Design Pattern   | **Mobile-first responsive design** (360px → tablet → desktop)                  |

### NPM Packages

```bash
npm create vite@latest . -- --template react
npm i react@18 react-dom@18 react-router-dom@6 @tanstack/react-query
npm i chart.js react-chartjs-2
npm i react-hook-form sonner
npm i -D @tanstack/react-query-devtools
npm i -D eslint@9 @eslint/js@9 globals eslint-plugin-react eslint-plugin-react-hooks@5 eslint-plugin-react-refresh   # npm run lint
```

> Vite's React template now installs React 19, so re-install `react@18 react-dom@18` right after creating the project.

## index.html (CDNs) + CSS

Bootstrap CSS comes from the CDN in `<head>`. Our CSS is imported in `src/main.jsx`, and Vite injects it **after** the Bootstrap `<link>`, so it can override Bootstrap. Scripts go at the end of `<body>`.

- `<head>`
  - `<meta name="viewport" content="width=device-width, initial-scale=1">` (required for mobile first)
  - Bootstrap 5.0.2 CSS (CDN)
- `<body>`
  - `<div id="root"></div>`
  - jQuery (CDN)
  - Bootstrap 5.0.2 bundle JS (CDN; includes Popper)
  - Vite entry `src/main.jsx`, which imports `./styles.css` then `./app.css`

| File             | Covers                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------- |
| `src/styles.css` | The dark login/signup screens. It also styles bare `input` and `h1` globally          |
| `src/app.css`    | The light app shell: design tokens on `:root` (`--accent`, `--priority-*`, `--status-*`, …), layout, table/cards, badges, panel, charts. It resets the global `input`/`h1` rules inside `.app-shell` |

Design tokens live on `:root` so `charts/chartTheme.js` can read them with `getComputedStyle`.

### Rules for Bootstrap + jQuery inside React

- Bootstrap 5 **does not need jQuery**. It's loaded only because it's part of the chosen setup.
- **Never let jQuery or Bootstrap JS change DOM that React renders** (for example `$('#x').hide()` or `new bootstrap.Modal()`). React loses track of that DOM and you get bugs.
- Use Bootstrap for **CSS classes** (grid, buttons, cards, forms, badges, alerts).
- Show and hide modals, alerts and so on with **React state** (conditional rendering + Bootstrap classes).
- The mobile sidebar offcanvas, the ⋯ row menus, the modals and the insights panel are all opened and closed by React state (Bootstrap markup + `show` class). Don't use `data-bs-toggle` for them.
- Bootstrap 5.0.2 sets some styles from its JS (offcanvas `visibility`, the backdrop, dropdown position via Popper). Since we don't use that JS, `app.css` provides them: `.offcanvas.show { visibility: visible }`, `.offcanvas-backdrop`, and an absolutely positioned `.row-menu`.
- Keyboard and focus handling lives in `hooks/useOverlay.js`, shared by `Modal` and `InsightsPanel`: Esc closes, page scroll is locked, focus moves into the dialog on open and returns to the trigger on close.

## Mobile First

- Base CSS targets **phones (~360px)**. Larger screens are added with `min-width` media queries only:
  ```
  base styles        → phone
  @media (min-width: 768px)  → tablet
  @media (min-width: 992px)  → desktop
  ```
- Bootstrap grid: start with `col-12`, then widen with `col-md-6`, `col-lg-4`.
- Tap targets are at least **44px** high. Inputs are at least **16px** font size, which stops iOS from zooming in.
- There's no horizontal scrolling. Long task titles wrap (`text-break`).
- The active timer bar is **fixed at the bottom** on mobile so Stop is always reachable.

## Folder Structure

✅ = built · ⏳ = specced, not built yet

```
frontend/
├── index.html                 # Bootstrap + jQuery CDNs, #root
├── public/
│   └── _redirects             # Netlify: /api proxy + SPA fallback
├── src/
│   ├── main.jsx               # QueryClient (defaults + global 401) + BrowserRouter + <App/>; imports CSS + chart setup
│   ├── App.jsx                # route table
│   ├── styles.css             # auth pages (dark)
│   ├── app.css                # app shell (light, mobile first), design tokens
│   ├── api/
│   │   ├── client.js          # apiFetch(path, { method, body, query }), ApiError { status, message, details }
│   │   ├── auth.js            # getMe, logout
│   │   ├── tasks.js           # listTasks, getTask, createTask, updateTask, deleteTask, aiSuggest, startTimer, stopTimer
│   │   ├── timelogs.js        # listTimeLogs, getActiveTimeLog, deleteTimeLog
│   │   ├── insights.js        # getInsights(range), getTaskInsights(id): the LLM runs on the server
│   │   └── summary.js         # ⏳ getToday(tzOffset)
│   ├── hooks/
│   │   ├── invalidate.js      # invalidate(queryClient, [keys]) helper
│   │   ├── useAuth.js         # useMe(), useLogout()
│   │   ├── useTasks.js        # useTasks, useTask, useAiSuggest, useCreateTask, useUpdateTask, useDeleteTask, useBulkTaskAction
│   │   ├── useTimer.js        # useActiveTimer, useStartTimer, useStopTimer, isRunningTask()
│   │   ├── useTimeLogs.js     # useTimeLogs(params, { enabled }), useDeleteTimeLog
│   │   ├── useInsights.js     # useInsights(range), useTaskInsights(id) (AI summary, cached, no auto-refetch)
│   │   ├── useNow.js          # current time in ms, ticking at a given interval (null = frozen)
│   │   ├── useElapsed.js      # seconds since startTime, ticks every second
│   │   ├── useMediaQuery.js   # table vs cards on the Tasks page
│   │   ├── useOverlay.js      # Modal + InsightsPanel: Esc closes, scroll lock, focus in/out
│   │   └── useSummary.js      # ⏳ today's summary query
│   ├── charts/
│   │   ├── setupCharts.js     # Chart.register(...) once: only the controllers/elements we use
│   │   ├── chartTheme.js      # chartColors() from CSS variables, baseOptions(), minutesTick / minutesTooltip
│   │   ├── ChartFigure.jsx    # <figure> + title + caption (the key fact) + empty state
│   │   ├── BarChart.jsx       # vertical / horizontal / stacked
│   │   ├── DoughnutChart.jsx  # optional onSliceClick(index)
│   │   └── LineChart.jsx
│   ├── components/
│   │   ├── Layout.jsx         # Sidebar + <main><Outlet/></main> + ActiveTimerBar
│   │   ├── Sidebar.jsx        # icon rail (≥ 992px) / top bar + hamburger offcanvas (< 992px)
│   │   ├── ProtectedRoute.jsx # <Outlet/> when logged in, else /login (remembers "from")
│   │   ├── PublicOnlyRoute.jsx# <Outlet/> when logged out, else /
│   │   ├── ActiveTimerBar.jsx # running task + live clock + Stop
│   │   ├── Icon.jsx           # inline SVG icons (no icon library)
│   │   ├── StatTiles.jsx      # Low / Medium / High / Total / Done / Overdue
│   │   ├── TaskTable.jsx      # desktop table (≥ 992px), server-sortable headers
│   │   ├── TaskCard.jsx       # the same row as a card (< 992px)
│   │   ├── TaskRowMenu.jsx    # ⋯ dropdown: Insights / Details & edit / Delete
│   │   ├── SelectCheckbox.jsx # 44px tap area, supports indeterminate
│   │   ├── BulkActionBar.jsx  # Mark complete / Status / Priority / Delete / Clear
│   │   ├── TaskForm.jsx       # "New task" modal (+ fieldErrorsFrom(error) helper)
│   │   ├── TrackedTime.jsx    # totalTime + live elapsed for the running task
│   │   ├── TimerButton.jsx    # Start / Stop for one task (icon or with label)
│   │   ├── StatusSelect.jsx   # native <select> styled as a status pill, PATCHes on change
│   │   ├── StatusBadge.jsx    # To do / Doing / Completed pill
│   │   ├── PriorityBadge.jsx  # flag + Low / Medium / High
│   │   ├── OverdueBadge.jsx
│   │   ├── DueDate.jsx        # "26 Sep 2026", red when overdue, nothing when empty
│   │   ├── InsightsPanel.jsx  # React-controlled offcanvas: task header + TaskInsights
│   │   ├── TaskInsights.jsx   # per-task stats, reminders, AI card, 3 charts (panel + Task Detail)
│   │   ├── ReminderList.jsx   # TaskReminderList, OverviewReminderList
│   │   ├── AiSummaryCard.jsx  # summary + tips, Regenerate, fallbacks (404 / 429 / aiGenerated=false)
│   │   ├── Modal.jsx          # Bootstrap modal markup, Esc/backdrop close, focus restore
│   │   ├── ConfirmModal.jsx   # confirm destructive actions
│   │   ├── Spinner.jsx · ErrorAlert.jsx · EmptyState.jsx
│   │   ├── AuthCard.jsx · AuthInput.jsx · PasswordInput.jsx   # login/signup UI
│   │   └── TimeLogItem.jsx    # ⏳
│   ├── pages/
│   │   ├── LoginPage.jsx · SignupPage.jsx   # ✅
│   │   ├── TasksPage.jsx      # ✅
│   │   ├── TaskDetailPage.jsx # ✅
│   │   ├── InsightsPage.jsx   # ✅
│   │   ├── NotFoundPage.jsx   # ✅
│   │   ├── TimeLogsPage.jsx   # ⏳
│   │   └── SummaryPage.jsx    # ⏳
│   └── utils/
│       ├── constants.js       # STATUSES + STATUS_LABELS (To do / Doing / Completed), PRIORITIES, SORT_OPTIONS
│       ├── formatDuration.js  # formatDuration(3725) → "1h 02m", formatClock(3725) → "01:02:05"
│       ├── formatDate.js      # todayLocal, toDateKey, parseDateKey, isValidDateKey, addDays, daysBetween, format*
│       ├── taskStats.js       # isOverdue(task, today), getTaskStats(tasks, today)
│       ├── insightsData.js    # pure log/task → chart data + reminders (takes `now` as an argument)
│       └── validation.js      # validateAuth, getAuthError
├── .env.example               # VITE_API_URL=
├── ARCHITECTURE.md
├── PROMPTS.md
└── docs/pages/*.md            # one spec per page
```

## Routes

| Path          | Page           | Access        | Doc                                   |
| ------------- | -------------- | ------------- | ------------------------------------- |
| `/login`      | LoginPage      | public only   | [login](docs/pages/01-login.md)       |
| `/signup`     | SignupPage     | public only   | [signup](docs/pages/02-signup.md)     |
| `/`           | TasksPage      | 🔒 protected  | [tasks](docs/pages/03-tasks.md)       |
| `/tasks/:id`  | TaskDetailPage | 🔒 protected  | [task detail](docs/pages/04-task-detail.md) |
| `/timelogs`   | TimeLogsPage ⏳ | 🔒 protected  | [time logs](docs/pages/05-time-logs.md) |
| `/summary`    | SummaryPage ⏳  | 🔒 protected  | [summary](docs/pages/06-summary.md)   |
| `/insights`   | InsightsPage   | 🔒 protected  | [insights (all tasks)](docs/pages/09-insights.md) |
| `*`           | NotFoundPage   | anyone        | [not found](docs/pages/07-not-found.md) |

- ⏳ = specced but not built yet. Those routes currently fall through to NotFoundPage, and the sidebar only lists built pages (Tasks, Insights). Add them to `LINKS` in `Sidebar.jsx` when the pages exist.
- Route nesting in `App.jsx`: `PublicOnlyRoute` wraps login/signup, and `ProtectedRoute` → `Layout` wraps the app pages. Both guards render `<Outlet/>`.
- Per-task insights are not a route. They open in a panel from the ⋯ menu on the Tasks page and also appear as a section on Task Detail. See [08-task-insights.md](docs/pages/08-task-insights.md).

Shared layout (sidebar and active timer bar): [00-layout.md](docs/pages/00-layout.md)

## State Management Architecture

A clear separation of concerns ensures predictable data flow and maintainability:

| Kind              | Purpose                                    | Storage Location          |
| ----------------- | ------------------------------------------ | ------------------------- |
| **Server state**  | User, tasks, timers, analytics data        | TanStack Query caching    |
| **Form state**    | Input values, validation, submission       | react-hook-form           |
| **UI state**      | Modals, menus, panel open/close            | React useState hooks      |
| **Navigation state** | Filters, sorting, pagination             | URL search params         |
| **User feedback** | Toast notifications and alerts              | sonner toast library      |

### Key Principles
- **Single source of truth:** Server state lives in TanStack Query; never duplicated in local state
- **URL-driven filters:** Task status/priority/sort persists across page refreshes
- **Derived data:** Computed values (stats, chart data) calculated at render time with `useMemo`, never stored
- **Form isolation:** Server errors mapped to individual fields; API responses never directly populate component state
- **Authentication:** `useMe()` hook queries the `['me']` cache; no separate auth context needed

## TanStack Query

### QueryClient defaults

- `staleTime: 30s`
- `refetchOnWindowFocus: true` (data refreshes when the user comes back to the tab)
- `retry`: **don't retry** on 401/403/404/409, retry once on other errors
- Mutations never retry

### Query keys

| Key                                   | Data                       |
| ------------------------------------- | -------------------------- |
| `['me']`                              | logged-in user or 401      |
| `['tasks']`                           | all of the user's tasks, newest first. Tasks and Insights filter/sort it in the browser |
| `['task', id]`                        | one task                   |
| `['timelogs', { taskId, from, to }]`  | time log list (empty params dropped). `/insights` builds `from` from `todayLocal()`, so the key is stable all day |
| `['timelogs', 'active']`              | running time log or `null` |
| `['summary', 'today']`                | today's summary            |
| `['insights', 'all', range]`          | AI summary for all tasks (`range` = `week` \| `month`) |
| `['insights', 'task', id]`            | AI summary for one task    |

`['insights', …]` queries call the LLM, so they use `staleTime: 5 min`, `refetchOnWindowFocus: false`, and `enabled` only while the panel/page is open. Mutations **do not** invalidate them. The user presses **Regenerate** (`refetch`) to get a fresh summary. Charts never wait for them: charts come from `tasks` and `timelogs` queries.

### What each mutation invalidates

Prefix matching means `['tasks']` invalidates every `['tasks', …]` key.

| Mutation      | Invalidate                                                      |
| ------------- | --------------------------------------------------------------- |
| login / signup | `setQueryData(['me'], user)`                                   |
| logout        | `queryClient.clear()` then navigate to `/login`                 |
| create task   | `['tasks']`, `['summary']`                                      |
| update task   | `['tasks']`, `['task', id]`, `['summary']` (on settle, so a failed PATCH also resyncs) |
| delete task   | remove `['task', id]` and `['insights', 'task', id]`, then `['tasks']`, `['timelogs']`, `['summary']` |
| start timer   | `['timelogs']` (includes `'active'` and the task's logs), `['tasks']`, `['task', id]`, `['summary']`, on settle, so a 409 also refreshes the active timer |
| stop timer    | `['timelogs']`, `['tasks']`, `['task', id]`, `['summary']`      |
| delete log    | `['timelogs']`, `['tasks']`, `['task']`, `['summary']`          |
| bulk update   | once, after all requests settle: `['tasks']`, `['task']`, `['summary']` |
| bulk delete   | once, after all requests settle: `['tasks']`, `['task']`, `['timelogs']`, `['summary']` |

### Bulk actions

There is no bulk endpoint. `useBulkTaskAction()` is one mutation whose `mutationFn` runs `Promise.allSettled(ids.map(id => api call))` and returns `{ ok: [ids], failed: [{ id, message }] }`. It invalidates once in `onSettled`, not per task. The page shows "3 tasks updated" or "2 updated, 1 failed" and keeps the failed ids selected.

## API Layer

`src/api/client.js` exports `apiFetch(path, { method, body, query })`:
- Prefixes `import.meta.env.VITE_API_URL` (empty string when using a proxy)
- Always sends `credentials: 'include'` so the auth cookie goes with every request
- Sends and parses JSON
- On `success: true`, returns `json.data`
- Otherwise throws `ApiError { status, message, details }`, where `details` is the Zod field errors or, for the 409 timer error, `{ taskId }`
- `path` is relative to `/api` (`apiFetch('/tasks')`), and `query` values that are `undefined`, `null` or `''` are left out
- A network failure throws `ApiError` with `status: 0` and "Network error. Check your connection and try again."

Pages never call `fetch` directly. Every request goes through `src/api/*` and is used through the hooks.

> Login and Signup post through `apiFetch` (`api/auth.js` → `login()` / `signup()`) using the shared `useAuthSubmit(type)` mutation. On success it calls `queryClient.setQueryData(['me'], user)` and navigates to `location.state.from` (or `/`).

### Global 401 handling

A `QueryCache` `onError` handler: if `error.status === 401` for any query other than `['me']`, set `['me']` to `null`. `ProtectedRoute` then redirects to `/login`. This covers an expired cookie in the middle of a session.

## Auth Flow

```
App loads → useMe() calls GET /api/auth/me
  loading → full-page Spinner
  200     → user object → protected pages render
  401     → null → ProtectedRoute redirects to /login (remembering "from" location)
Login OK  → setQueryData(['me'], user) → navigate(from || '/')
Logout    → POST /logout → queryClient.clear() → /login
```

The token lives in an httpOnly cookie, so **the frontend never sees or stores the JWT.** There's nothing in localStorage.

## Timer Rules (frontend side)

- The running timer comes from `['timelogs', 'active']`. Only one can run at a time, a rule the server enforces.
- **Elapsed = now − `startTime` (from the server)**, recalculated every second by `useElapsed`. It survives page refreshes and works across tabs.
- While a timer is running:
  - The running task shows **Stop** and a live clock.
  - Every other task's **Start** is disabled, with a hint: "Stop the running timer first".
- On 409, show "A timer is already running. Stop it first." (`TimerButton` passes it to `toast.error` through `onError`) and refetch the active query.
- The live clocks (`TrackedTime`, `ActiveTimerBar`) tick every second through `useElapsed`. Charts use `useNow(30_000)` while a timer is running, so they don't redraw every second.
- `task.totalTime` counts **finished** sessions only. For the running task, the UI shows `totalTime + elapsed`.

## Charts (Chart.js)

- `src/charts/setupCharts.js` is imported once in `main.jsx`. Charts are loaded with the app (not lazy-loaded) so they animate in together with the page. It registers only what we use (`BarController`, `LineController`, `DoughnutController`, `BarElement`, `LineElement`, `PointElement`, `ArcElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend`, `Filler`). Don't `import 'chart.js/auto'`, because it pulls in everything.
- Chart.js draws on a `<canvas>`, which React owns through `react-chartjs-2`. Never touch the chart with jQuery.
- **Chart data is derived, never stored.** Compute it with `useMemo` from query data using the pure helpers in `utils/insightsData.js`. Don't put chart data in state.
- Colors come from CSS variables (`--priority-high`, `--status-done`, …) read once in `chartTheme.js`, so charts match the badges.
- Every chart wrapper sets `maintainAspectRatio: false` inside a fixed-height box (220px on mobile, 280px on desktop). Otherwise it collapses or overflows on small screens.
- **Accessibility:** a canvas is invisible to screen readers. Each chart sits in a `<figure>` with a `<figcaption>` that states the key number ("12h 40m this week, most on Tuesday") and `role="img"` + `aria-label` on the canvas.
- Every chart has an empty state ("No time tracked yet") instead of an empty axis.

## AI / LLM Rule

**The LLM is called only by the backend.** The frontend never holds an LLM key, never calls an LLM provider, and never builds prompts. It calls our own `/api/.../insights` endpoints, which return `{ summary, tips, aiGenerated }`. When `aiGenerated` is `false` (the AI failed or isn't configured), the charts and reminders still work, and the AI card shows "AI summary unavailable right now".

## Time Zone

Every summary and insights request sends `tzOffset = new Date().getTimezoneOffset()`, so "today" matches the user's local day. All dates are displayed in local time with `toLocaleString`.

## Error / Loading / Empty States (every page)

| State      | UI                                                        |
| ---------- | --------------------------------------------------------- |
| Loading    | `Spinner` (centered). Use skeleton cards on list pages if time allows |
| Error      | `ErrorAlert` with the API message + **Retry** button (`refetch`) |
| Empty      | `EmptyState` with a short hint and a call-to-action button |
| Mutation pending | Button disabled + small spinner. Prevents double submits |
| Field errors (400) | Show `details[].message` under the matching input (`is-invalid`) |

## Environment & Local Dev

`.env.example`
```
VITE_API_URL=
```

- **Local:** Vite dev server proxy sends `/api` → `http://localhost:3000` (the backend `PORT`), so `VITE_API_URL` stays empty. The browser sees one origin, so cookies just work.
- **Production (Netlify):** `public/_redirects`
  ```
  /api/*  https://<render-app>.onrender.com/api/:splat  200
  /*      /index.html                                   200
  ```
  The first line proxies the API so it's same-origin, and the second makes React Router deep links (`/tasks/123`) work on refresh. The **order matters**: `/api` must come first.

## Accessibility & UX Basics

- Every input has a `<label>` (`form-label`). Buttons have clear text, not just icons. The only exceptions are the sidebar rail and the ⋯ button, and those need `aria-label` + `title`.
- Row checkboxes have `aria-label="Select <task title>"`. The header checkbox is `indeterminate` when only some rows are selected.
- Status and priority are shown with text **and** color (`StatusBadge`, `PriorityBadge`), not color alone.
- **Due dates:** the API sends `dueDate` as a plain `"YYYY-MM-DD"` string. Send the value of `<input type="date">` as is. **Never** pass it through `new Date("2026-09-30")`: that parses as UTC midnight and shows the previous day in timezones west of UTC. For display, split the string or use `new Date(y, m - 1, d)`. A task is overdue when `dueDate < todayLocal()` and it isn't completed. `formatDate.js` has the helpers (`parseDateKey`, `todayLocal`, `daysBetween`, `addDays`), and `isValidDateKey()` rejects impossible dates like `2026-02-31` before they're sent (create form + edit form).
- Confirm before destructive actions: deleting a task, several tasks (bulk), or a time log.
- Icon-only buttons in tables (Start/Stop, ⋯, delete session) have an `aria-label` that names the task, e.g. "Start timer: Progress Update".
- Animations (`live-dot`, spinning refresh icon) stop under `prefers-reduced-motion`.
- `document.title` is set per page ("Tasks · TaskTracker").

## Build Status

| Feature                                              | Status     |
| ---------------------------------------------------- | ---------- |
| Layout, navigation, authentication guards           | ✅ Complete |
| Tasks page (dashboard tiles, table/card views)      | ✅ Complete |
| Bulk operations (update, delete multiple tasks)     | ✅ Complete |
| Task creation with AI suggestions                   | ✅ Complete |
| Task detail view with edit mode                     | ✅ Complete |
| Time tracking with live timer                       | ✅ Complete |
| Analytics & insights (charts, reminders, AI summary)| ✅ Complete |
| Time logs view                                      | Planned    |
| Daily summary view                                  | Planned    |

### Quality Assurance
- ✅ Tested across responsive breakpoints (360px mobile, 768px tablet, 1440px desktop)
- ✅ Cross-browser verification (headless Chromium against production backend)
- ✅ Zero console errors; full accessibility compliance
- ✅ Mobile-optimized: no horizontal scroll, touch-friendly tap targets (44px minimum)

### Development Workflow
The Vite development server includes automatic `/api` proxying to the backend, enabling local testing with real authentication cookies and a single origin.

