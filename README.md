# TaskTracker Frontend

Production-grade single-user **task & time-tracking** React SPA. JWT auth, task management, real-time timers, AI suggestions, and analytics — styled mobile-first. Paired Express + MongoDB backend lives in `../backend`.

**Demo account:** email `demo1234@gmail.com` · password `demo1234`

## Live Demo

[TaskTracker Live Demo](https://task-tracker-by-vikas.netlify.app/)

## Source Code

- [Frontend Repository](https://github.com/NeXTcanCode/task_mgmt_frontend)
- [Backend Repository](https://github.com/NeXTcanCode/task_mgmt_backend)

Use the demo account above for easier review.

## Review Checklist

- ✅ Local development setup instructions
- ✅ Brief frontend tech-stack summary
- ✅ Live deployed link
- ✅ Live demo link is available above
- ✅ Working authentication with protected routes
- ✅ Optional test credentials are provided above

## Tech Stack

| Concern          | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Build & bundling | Vite 5.4                                            |
| UI framework     | React 18                                            |
| Routing          | react-router-dom v6 (route guards, deep links)      |
| Server state     | TanStack Query v5 (caching, refetching)             |
| Forms            | react-hook-form + custom validation                 |
| Charts           | Chart.js 4 + react-chartjs-2                        |
| Notifications    | sonner toasts                                       |
| Styling          | Bootstrap 5 (CDN) + vanilla CSS design tokens       |
| HTTP             | Native `fetch` with interceptors                    |

## Getting Started

```bash
cd frontend
npm install
npm run dev
# Vite dev server → http://localhost:5173
# proxies /api → http://localhost:3000 (backend)
```

**Environment** (`.env.example`): `VITE_API_URL` — leave empty for local dev (Vite proxy handles `/api`). Netlify uses `public/_redirects`.

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Routes

| Path         | Page           | Access        | Status |
| ------------ | -------------- | ------------- | ------ |
| `/login`     | LoginPage      | public only   | ✅     |
| `/signup`    | SignupPage     | public only   | ✅     |
| `/`          | TasksPage      | 🔒 protected  | ✅     |
| `/tasks/:id` | TaskDetailPage | 🔒 protected  | ✅     |
| `/insights`  | InsightsPage   | 🔒 protected  | ✅     |
| `/timelogs`  | TimeLogsPage   | 🔒 protected  | ⏳     |
| `/summary`   | SummaryPage    | 🔒 protected  | ⏳     |
| `*`          | NotFoundPage   | anyone        | ✅     |

⏳ planned routes currently fall through to NotFoundPage. Add `LINKS` entries in `Sidebar.jsx` when built.

## Features

- JWT auth via **httpOnly cookie** (per-user data isolation), protected/public-only route guards, global 401 logout
- **Task management:** create/edit/delete, status & priority pills, due dates with overdue badges, server-sortable table (≥992px) and cards (<992px)
- **Bulk actions:** select multiple tasks → mark complete / status / priority / delete
- **Timers:** one active timer per user (server-enforced); live elapsed clock; starting on `pending` task promotes it to `in_progress`; fixed bottom bar on mobile
- **AI:** task suggestion (`aiSuggest`) and insights summaries (`week`/`month`, per task) — LLM runs server-side, key never in frontend; graceful fallback when unavailable
- **Analytics:** 7-day & 30-day bar/line/doughnut charts, task stats, reminders
- **Mobile-first** (360px → 768px → 992px), ≥44px tap targets, input ≥16px font, no horizontal scroll

## Project Structure

```
src/
├── main.jsx            # QueryClient + BrowserRouter + <App/>; imports CSS + chart setup
├── App.jsx             # route table
├── styles.css          # auth pages (dark)
├── app.css             # app shell (light, mobile-first), design tokens on :root
├── api/                # client.js (apiFetch + ApiError) + per-domain API modules
├── hooks/              # TanStack Query hooks + UI hooks (useElapsed, useOverlay, etc.)
├── charts/             # setup (register once), theme (CSS vars), ChartFigure, Bar/Line/Doughnut
├── components/         # Layout, Sidebar, TaskTable/Card, TaskForm, Modal, InsightsPanel, badges…
├── pages/              # Login, Signup, Tasks, TaskDetail, Insights, NotFound
└── utils/              # constants, formatDuration/Date, taskStats, insightsData, validation
```

## Architecture Notes

- **Entry** `src/main.jsx`: `QueryClient` defaults `staleTime: 30s`, `refetchOnWindowFocus`, no retry on 401/403/404/409. All queries route through `BaseURL`, never direct fetch.
- **High-level full-stack overview** → [`ARCHITECTURE.md`](ARCHITECTURE.md) · **product & backend details** → [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) · **page specs** → [`docs/pages/`](docs/pages/) · **build prompt history** → `PROMPTS.md`# task_mgmt_frontend
