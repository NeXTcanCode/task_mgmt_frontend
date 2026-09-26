# Layout (shared by all protected pages)

**Status:** ✅ built · **Components:** `Layout.jsx`, `Sidebar.jsx`, `Icon.jsx`, `ActiveTimerBar.jsx`, `ProtectedRoute.jsx`, `PublicOnlyRoute.jsx`

## Purpose

This is the frame around every logged-in page: an icon sidebar on desktop (a top bar with a hamburger on smaller screens), page content in the middle, and the running timer pinned at the bottom.

## Structure

```
<Route element={<ProtectedRoute/>}>        ← renders <Outlet/> when logged in
  <Route element={<Layout/>}>
    <div class="app-shell">
      <Sidebar/>
      <main class="app-main [has-timer]"> <Outlet/> </main>   ← margin-left: 72px at ≥ 992px
      <ActiveTimerBar/>                                        ← only when a timer is running
    </div>
  </Route>
</Route>
```

## ProtectedRoute

| `useMe()` state | Render                                                         |
| --------------- | -------------------------------------------------------------- |
| loading         | full-page `Spinner`                                            |
| user            | children                                                       |
| `null` / 401    | `<Navigate to="/login" replace state={{ from: location }} />`  |
| other error (network, 500) | `ErrorAlert` + Retry. It does **not** log the user out |

## PublicOnlyRoute (login and signup)

If the user is already logged in, redirect to `/`. Otherwise render the page (`<Outlet/>`). While `['me']` is loading it shows the full-page Spinner.

## Sidebar

| < 992px (phone + tablet)                          | ≥ 992px (desktop)                              |
| ------------------------------------------------- | ---------------------------------------------- |
| Top bar: brand left, **hamburger** right (44×44px) | Fixed **icon rail**, 72px wide, full height    |
| Hamburger opens an **offcanvas** from the left with icon + text links | Icons only, with a tooltip and `aria-label` per link |
| User name + Logout at the bottom of the offcanvas | User initial avatar + Logout icon at the bottom |

```
Desktop                          Mobile
┌────┬──────────────────────     ┌──────────────────────────┐
│ ▣  │  (active: purple tile)    │ TaskTracker           ☰  │
│ ☑  │  Tasks                    └──────────────────────────┘
│ 📊 │  Insights                  ☰ → offcanvas
│ ⏱  │  Time Logs                 ┌────────────────┐
│ 📅 │  Today                     │ ☑ Tasks        │
│    │                            │ 📊 Insights     │
│ …  │                            │ ⏱ Time Logs    │
│ (J)│  avatar                    │ 📅 Today        │
│ ⎋  │  Logout                    │ ─────────────  │
└────┘                            │ Jane · Logout  │
                                  └────────────────┘
```

- **Links (in order):** Tasks (`/`), Insights (`/insights`). Time Logs (`/timelogs`) and Today (`/summary`) get added to the `LINKS` array in `Sidebar.jsx` once those pages are built. Use `NavLink`: the active one gets the tinted tile (`.sidebar-link.active`).
- **Brand:** a purple "T" tile at the top of the rail. The avatar shows the user's initial and has the name as a tooltip.
- **Icons:** inline SVG from `Icon.jsx` (`currentColor`, 22px). There's no icon library. Icon-only links **must** have `aria-label` and a `title` tooltip, so they aren't icon-only for screen readers.
- **Offcanvas:** a `useState` boolean (`menuOpen`) is enough here: one isolated flag. Render the Bootstrap `offcanvas offcanvas-start show` markup plus a backdrop `div` only when it's open. **Don't** use `data-bs-toggle` or `new bootstrap.Offcanvas()`.
  - Close it when: a link is tapped, the backdrop is tapped, **Esc** is pressed, or the route changes (`useLocation` effect).
  - While it's open, set `overflow: hidden` on `body`, and move focus to the first link.
  - Bootstrap 5.0.2 sets offcanvas `visibility` and the backdrop from JS, so `app.css` supplies `.offcanvas.show { visibility: visible }` and `.offcanvas-backdrop`.
- The CSS breakpoint for the rail vs. top bar is **992px** (`lg`), the same one the Tasks table uses.

## ActiveTimerBar

**Data:** `useActiveTimer()` → `['timelogs', 'active']`, `refetchOnWindowFocus: true`

Shown only when `timeLog !== null`.

```
Mobile (fixed bottom, full width)
┌──────────────────────────────────────────┐
│ ● Follow up with UI Designer   00:12:48  [Stop] │
└──────────────────────────────────────────┘
```

- The task title links to `/tasks/:taskId` and is truncated with an ellipsis.
- The clock uses `useElapsed(timeLog.startTime)`, which ticks every second.
- **Stop** calls the stop-timer mutation and is disabled while pending.
- Add `padding-bottom` to `main` while the bar is visible so it never covers content.
- On desktop it stays fixed at the bottom, offset by the 72px rail (`left: 72px`), centered with a max width.

## Logout

1. `POST /api/auth/logout`
2. `queryClient.clear()`
3. `navigate('/login', { replace: true })`

Even if the request fails, clear the cache and go to `/login`.

## Acceptance

- [ ] Refreshing on any protected URL keeps the user logged in (the cookie is still valid)
- [ ] Visiting a protected URL while logged out goes to `/login`, then back after login
- [ ] The timer bar appears or disappears immediately on start/stop from any page
- [ ] The hamburger menu is usable one-handed on a 360px-wide screen and closes after navigation
- [ ] On desktop the icon rail shows the active page and every icon has a tooltip/label
