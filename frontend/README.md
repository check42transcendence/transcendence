# TripCollab Frontend

React + TypeScript + Vite, with Tailwind CSS v4, Inter, and Lucide icons.

## Development

Use the Node.js version in the repository's `.nvmrc`. From `frontend/`
in your development environment (the Ubuntu development container if used):

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite updates the page when source files change.
The `/api` proxy defaults to `http://127.0.0.1:3000`; set `API_PROXY_TARGET`
to use another backend address. The running app checks the session on startup
and requires a reachable backend.
For real Auth testing, use the Docker/HTTPS setup in the
[project README](../README.md), as authentication cookies are Secure.

Before submitting changes:

```bash
npm test
npm run lint
npm run build
```

## Routing

`main.tsx` provides one `BrowserRouter`; routes are defined in `App.tsx`.

- `/` redirects to `/login`.
- `/login` and `/register` show the Auth pages.
- `/home` is a temporary Auth verification page showing the current user
  and a sign-out button. Unauthenticated users are redirected to `/login`.
- Unknown paths show the not-found page.

Use React Router navigation instead of local state to switch pages.

## Authentication

`src/api/auth.ts` provides `register`, `login`, `getMe`, and `logout` using
the shared API client. `App.tsx` manages user state, loading, errors, and navigation.

- Registration shows a success message; it does not log the user in.
- Login saves the returned user in React state and opens `/home`.
- On startup or refresh, `getMe()` restores the user from the backend session.
  A `401` means unauthenticated; other failures show an error with a retry button.
- Logout clears the backend cookie and local user state, then returns to `/login`.
  If logout fails, the current user is preserved and an error is shown.

`npm test` runs API and page tests with mocked requests; no backend is required.
Playwright tests verify the real Auth flow using a separate Docker stack
and database. See the [E2E guide](../e2e/README.md) for running them.

## Shared API Client

Use the helpers in `src/shared/api/api-client.ts`:

| Helper | Use |
| --- | --- |
| `apiClient(path, options?)` | Returns the raw response, including empty `204` responses. |
| `apiJson<T>(path, options?)` | Reads a JSON response. |
| `apiPostJson<T>(path, data)` | Sends JSON with POST and reads a JSON response. |

Pass paths such as `/auth/me`; the client adds `/api` and uses same-origin
cookie credentials. Type `T` describes the expected data without runtime validation.

HTTP failures throw `ApiError` with `code`, `message`, `status`, and optional
`details`. Unreadable error responses use `HTTP_ERROR`. Pages handle loading,
error messages, and navigation.

Run `npm test` to check the client with mocked requests; no backend is required.

## Shared UI Components

Components live in `src/components/ui/` and accept their native HTML
attributes plus the props below.

| Component | Props and behavior |
| --- | --- |
| `Button` | `variant`: `primary` (default), `secondary`, or `danger`; `isLoading` disables interaction and shows a centered spinner while preserving button dimensions and its accessible name. `disabled` uses the shared disabled colors. Defaults to `type="button"`. |
| `Input` | Required `label`, optional `error`; supports `value`/`onChange`, `disabled`, and `readOnly`. Associates labels and error messages with the input. |
| `Card` | A non-interactive container with shared padding, border, radius, and shadow. Place content and action controls inside it. |

```tsx
import { useState } from 'react'
import { Button } from './components/ui/Button'
import { Card } from './components/ui/Card'
import { Input } from './components/ui/Input'

export function Example() {
  const [email, setEmail] = useState('')

  return (
    <Card className="space-y-4">
      <Input
        label="Email"
        type="email"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
      />
      <Button variant="secondary" disabled={!email.trim()}>
        Example action
      </Button>
    </Card>
  )
}
```

The example demonstrates composition; it does not submit data. Pages own
request state, validation, error text, and confirmation for dangerous actions.
Use separate state variables for independent controlled inputs.

Buttons accept icons through `children`, for example a Lucide icon followed
by text. Use `size={20}`, `strokeWidth={2}`, and `aria-hidden="true"` for
decorative icons. Icon-only buttons need an accessible name (`aria-label`).

Input hover keeps the default white background; focus and errors provide
feedback. Card has no built-in hover effect or whole-card click action.

## Styling

Design values and Tailwind mappings live in
`src/styles/tripcollab.tokens.css`; `src/index.css` loads them and defines
base styles and the shared keyboard focus class, `tc-focus`.

Reuse semantic classes such as `bg-brand`, `rounded-control`, and
`text-muted`. Component classes are grouped into named constants with
English comments. Use `className` for layout additions such as margins or
width; do not rely on class-string order to override component colors or states.
