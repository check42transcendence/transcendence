import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from './components/ui/Button'
import { Input } from './components/ui/Input'
import { Card } from './components/ui/Card'

function App() {
  const [status, setStatus] = useState('Not checked')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  async function checkBackend() {
    setLoading(true)
    setStatus('Checking...')

    try {
      const response = await fetch('/api/health')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'ok') {
        throw new Error('Unexpected response')
      }

      setStatus('Backend is running')
    } catch {
      setStatus('Unable to verify backend status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-4 px-4 py-8">
      <h1 className="text-page-title">Travel Planner</h1>
      <Card className="space-y-3">
        <h2 className="text-card-title font-medium">
          A weekend trip with friends
        </h2>

        <p className="text-muted">
          Plan activities together, discuss proposals, and keep
          everyone informed about the trip.
        </p>

        <Button variant="secondary">Example action</Button>
      </Card>

      <Input
        label="Email"
        type="email"
        name="email"
        placeholder="you@example.com"
        required
        value={email}
        error={emailError}
        onChange={(event) => {
          setEmail(event.currentTarget.value)
          setEmailError('')
        }}
        onBlur={() => {
          setEmailError(email.trim() ? '' : 'Email is required.')
        }}
      />

      <Input
        label="Disabled email"
        type="email"
        defaultValue="disabled@example.com"
        disabled
      />

      <Input
        label="Read-only email"
        type="email"
        value="readonly@example.com"
        readOnly
      />

      <div className="flex flex-wrap gap-4">
        <Button onClick={checkBackend} isLoading={loading}>
          Check backend
        </Button>
        <Button variant="secondary">
          <Plus size={15} strokeWidth={5} aria-hidden="true" />
          With icon
        </Button>
        <Button variant="danger">
          Danger
        </Button>
        <Button disabled>Disabled</Button>
        <Button isLoading>Loading example</Button>
        <Button disabled>Primary disabled</Button>
        <Button variant="secondary" disabled>Secondary disabled</Button>
        <Button variant="danger" disabled>Danger disabled</Button>
      </div>

      <p role="status">{status}</p>
    </main>
  )
}

export default App
