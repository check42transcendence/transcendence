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
The `/api` proxy targets `127.0.0.1:3000`; the backend must be reachable
from the same environment. UI styling can be developed without a backend.
For the full Docker/HTTPS setup, see the [project README](../README.md).

Before submitting changes:

```bash
npm run lint
npm run build
```

## Shared UI Components

Components live in `src/components/ui/` and accept their native HTML
attributes plus the props below.

| Component | Props and behavior |
| --- | --- |
| `Button` | `variant`: `primary` (default), `secondary`, or `danger`; `isLoading` disables interaction while keeping the label and appearance. `disabled` uses the shared disabled colors. Defaults to `type="button"`. |
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
