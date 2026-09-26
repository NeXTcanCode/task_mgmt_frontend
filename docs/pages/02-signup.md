# Signup Page

**Route:** `/signup` · **Access:** public only · **File:** `pages/SignupPage.jsx` · **Status:** ✅ built (see *Implementation* at the end)

## Purpose

A new user creates an account and is logged in immediately; the backend sets the cookie on signup.

## API

| Action | Hook          | Endpoint                 | On success                                  |
| ------ | ------------- | ------------------------ | ------------------------------------------- |
| Submit | `useSignup()` | `POST /api/auth/signup`  | `setQueryData(['me'], user)` → `navigate('/')` |

## Form state: react-hook-form (same as Login)

```
defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
```

Validation uses `authRules` from `utils/validation.js`. `confirmPassword` is **client-only** (its rule compares it with `password`) and is never sent to the API.

## Layout (mobile first)

```
┌─────────────────────────┐
│   Create your account   │
│ [alert: formError]      │
│ Name             [____] │
│ Email            [____] │
│ Password         [____] │  hint: 8+ characters
│ Confirm password [____] │
│ [     Sign up       ]   │
│ Have an account? Log in │
└─────────────────────────┘
```

## Client Validation (mirrors the backend Zod rules)

| Field           | Rule                      | Message                            |
| --------------- | ------------------------- | ---------------------------------- |
| name            | 2–50 chars (trimmed)      | "Name must be 2–50 characters"     |
| email           | valid email               | "Enter a valid email"              |
| password        | 8–72 chars                | "Password must be at least 8 characters" |
| confirmPassword | equals password           | "Passwords don't match"            |

Show errors under each input after submit, or on blur.

## Error Handling

| Response | UI                                                       |
| -------- | -------------------------------------------------------- |
| 400      | Map `details[]` to field errors                          |
| 409      | Email field error: "This email is already registered" + a link to login |
| 429      | formError: "Too many attempts. Please wait a few minutes." |

## Acceptance

- [ ] A new user lands on the Tasks page, already logged in
- [ ] A duplicate email shows the error on the email field
- [ ] The password is never logged or kept after an error (the password fields are cleared on failure)

## Implementation (as built)

The page was built before the shared API layer, so it differs from the plan above:

| Planned | Built |
| ------- | ----- |
| `useLogin()` / `useSignup()` hooks + `apiFetch` | one shared `useAuthSubmit('signup')` mutation → `apiFetch` |
| shared `authFormReducer` | react-hook-form with shared `authRules`; `isSubmitting` instead of a pending flag |
| error mapping | `utils/validation.js` → `validateAuth()`, `getAuthError()` (401 / 409 / 429 messages) |
| UI | dark `AuthCard` with a Sign in / Sign up switch (`components/AuthCard.jsx`, `AuthInput`, `PasswordInput`), styled by `src/styles.css` |

On success: `queryClient.setQueryData(['me'], data.user)`, then `navigate(location.state?.from?.pathname || '/', { replace: true })`. Setting `['me']` matters: without it, a cached `null` from before login would make `ProtectedRoute` bounce back to `/login`.

`PublicOnlyRoute` wraps this page, so a logged-in user who opens it is redirected to `/`.
