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

## Translation Keys

Keep frontend UI text in `src/shared/i18n/en.ts` and read it with `t()`.
English is the only current language; language switching is not included.

```tsx
import { t } from '../shared/i18n/translation'

<h1>{t('auth.login.title')}</h1>
```

Adjust the import path for your file. Add new keys under the matching comment
in `en.ts`:

- `app.*`: product name and tagline.
- `common.*`: messages shared across the application.
- `auth.shared.*`: labels and actions shared by Auth pages.
- `auth.login.*` / `auth.register.*`: page-specific messages.
- `auth.session.*` / `auth.logout.*`: session and logout messages.
- `notFound.*`: not-found page messages.

Follow the same pattern for new features. Reuse keys when their meaning is the
same. Backend error messages and the default HTTP error remain in English.

## Shared Layout

Layout components live in `src/components/layout/`:

- `PageContainer`: a centered `<main>` with a 440px maximum width and shared
  padding, used by the Auth and not-found pages. Use `className` for extra spacing.
- `AuthHeader`: the product name and tagline shared by login and registration.

Example from a page in `src/pages/`:

```tsx
import { PageContainer } from '../components/layout/PageContainer'
import { AuthHeader } from '../components/layout/AuthHeader'

<PageContainer className="space-y-4">
  <AuthHeader />
  {/* Page content goes here. */}
</PageContainer>
```

`PageContainer` already provides `<main>`; do not nest another `<main>` inside it.

## Shared UI Components

Components live in `src/components/ui/`. Button, Input, Textarea, Select,
Card, and Badge accept native HTML attributes; EmptyState uses the props below.

| Component | Props and behavior |
| --- | --- |
| `Button` | `variant`: `primary` (default), `secondary`, or `danger`; `isLoading` disables interaction and shows a centered spinner while preserving button dimensions and its accessible name. `disabled` uses the shared disabled colors. Defaults to `type="button"`. |
| `Input` | Required `label`, optional `error`; supports `value`/`onChange`, `disabled`, and `readOnly`. Associates labels and error messages with the input. |
| `Textarea` | Required `label`, optional `error`; defaults to 4 rows and disables manual resizing. Supports `value`/`onChange`, `disabled`, and `readOnly`, with labels and errors associated with the control. |
| `Select` | Required `label`, optional `error`; accepts native `<option>` children, `value`/`onChange`, and `disabled`. Uses the browser's dropdown and keyboard behavior; no `readOnly` support. |
| `Card` | A non-interactive container with shared padding, border, radius, and shadow. Place content and action controls inside it. |
| `Badge` | Non-interactive label. `variant`: `neutral` (default), `success`, `warning`, `danger`, or `info`. Pass the label as children; pages choose the variant. |
| `EmptyState` | Required `title`; optional `description`, `action` (React content), and `className`. Displays a centered empty-content message. |

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

### Form control examples

Import `Textarea` and `Select` from `src/components/ui/`:

```tsx
<Textarea label="Description" name="description" maxLength={500} />

<Select label="Transport" name="transport" defaultValue="" required>
  <option value="" disabled>Choose transport</option>
  <option value="train">Train</option>
  <option value="bus">Bus</option>
</Select>
```

The disabled initial option acts as a muted prompt. Pages supply validation
messages through `error`; components do not perform business validation.

### Display component examples

Import `Badge` and `EmptyState` from `src/components/ui/`:

```tsx
<Badge variant="success">Accepted</Badge>

<EmptyState
  title="No trips yet"
  description="Create your first trip to get started."
  action={<Button onClick={handleCreateTrip}>Create trip</Button>}
/>
```

Pages provide translated text, choose status variants, and implement actions
such as `handleCreateTrip`. These components do not fetch data or run business logic.

### Local UI preview

Run `npm run dev` and open `http://localhost:5173/ui.html` to preview components
without a backend or session check. Edit `src/dev/UiPreview.tsx` to add examples.
This is a Vite development entry; the current production build uses `index.html`.

## Styling

Design values and Tailwind mappings live in
`src/styles/tripcollab.tokens.css`; `src/index.css` loads them and defines
base styles and the shared keyboard focus class, `tc-focus`.

Reuse semantic classes such as `bg-brand`, `rounded-control`, and
`text-muted`. Component classes are grouped into named constants with
English comments. Use `className` for layout additions such as margins or
width; do not rely on class-string order to override component colors or states.
