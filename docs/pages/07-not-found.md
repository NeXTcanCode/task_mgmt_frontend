# Not Found Page

**Route:** `*` · **Access:** anyone · **File:** `pages/NotFoundPage.jsx` · **Status:** ✅ built

## Purpose

Catches unknown URLs so the user never sees a blank screen.

## Layout

```
        404
  Page not found
  [ Go to Tasks ]   ← goes to "/" (ProtectedRoute sends logged-out users to /login)
```

- Centered, no navbar required.
- No API calls, no reducer.

## Related: resource not found

A **task** that doesn't exist (`/tasks/<bad-id>`) is handled inside the Task Detail page with its own "Task not found" message. This page covers unknown **routes** only.

## Netlify

`public/_redirects` sends every path to `index.html` (`/* /index.html 200`), so React Router decides between a real page and this one. Without it, refreshing `/summary` on Netlify returns Netlify's own 404.
