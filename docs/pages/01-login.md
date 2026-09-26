# Login Page

**Route:** `/login` · **Access:** public only · **File:** `pages/LoginPage.jsx` · **Status:** ✅ built (see *Implementation* at the end)

## Purpose

An existing user signs in with email and password.

## API

| Action | Hook         | Endpoint                | On success                                   |
| ------ | ------------ | ----------------------- | -------------------------------------------- |
| Submit | `useLogin()` | `POST /api/auth/login`  | `setQueryData(['me'], user)` → `navigate(from \|\| '/')` |

## Form state: react-hook-form

```
useForm({ defaultValues: { email: '', password: '' } })
  register('email', authRules.email) / register('password', authRules.password)   // rules in utils/validation.js
  errors.<field>.message   → field errors (client rules, or API 400 details via setServerErrors)
  errors.root.message      → top alert: 401 / 429 / network message
  formState.isSubmitting   → disables the button
```

A failed request clears the password (`resetField('password')`). The show/hide password toggle is local `useState` inside `PasswordInput`.

## Layout (mobile first)

```
┌─────────────────────────┐
│      TaskTracker        │
│  Log in to your account │
│ [alert: formError]      │
│ Email     [__________]  │
│ Password  [______] 👁   │
│ [      Log in       ]   │   ← full-width button
│ No account? Sign up     │
│ Demo: demo@test.com ... │   ← optional test credentials
└─────────────────────────┘
```

- Centered card: `col-12` on mobile, `col-md-6 col-lg-4` on larger screens.
- `type="email"`, `autoComplete="email"` / `"current-password"`.

## Client Validation (before calling the API)

- Email is required and must look like an email
- Password is required

## Error Handling

| Response | UI                                                                 |
| -------- | ------------------------------------------------------------------ |
| 400      | Map `details[]` to field errors                                    |
| 401      | formError: "Invalid email or password". Keep the email, clear the password |
| 429      | formError: "Too many attempts. Please wait a few minutes."         |
| Network  | formError: "Can't reach the server. Check your connection."        |

## Acceptance

- [ ] Submitting with Enter works
- [ ] The button is disabled with a spinner while the request is pending (no double submit)
- [ ] After login, the user returns to the page they originally tried to open
- [ ] A logged-in user visiting `/login` is redirected to `/`

## Implementation (as built)

The page was built before the shared API layer, so it differs from the plan above:

| Planned | Built |
| ------- | ----- |
| `useLogin()` / `useSignup()` hooks + `apiFetch` | one shared `useAuthSubmit('login')` mutation → `apiFetch` |
| shared `authFormReducer` | react-hook-form with shared `authRules`; `isSubmitting` instead of a pending flag |
| error mapping | `utils/validation.js` → `validateAuth()`, `getAuthError()` (401 / 409 / 429 messages) |
| UI | dark `AuthCard` with a Sign in / Sign up switch (`components/AuthCard.jsx`, `AuthInput`, `PasswordInput`), styled by `src/styles.css` |

On success: `queryClient.setQueryData(['me'], data.user)`, then `navigate(location.state?.from?.pathname || '/', { replace: true })`. Setting `['me']` matters: without it, a cached `null` from before login would make `ProtectedRoute` bounce back to `/login`.

`PublicOnlyRoute` wraps this page, so a logged-in user who opens it is redirected to `/`.
