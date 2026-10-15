import { useState } from 'react'

function App() {
  const [status, setStatus] = useState('Not checked')
  const [loading, setLoading] = useState(false)

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
      <p className="rounded-card bg-surface p-5 text-ink shadow-subtle">
        Plan your next trip together.
      </p>

      <button
        className="tc-focus h-control rounded-control bg-brand px-5 text-small text-surface enabled:hover:bg-brand-hover transition-colors duration-(--tc-duration-fast) motion-reduce:transition-none"
        onClick={checkBackend}
        disabled={loading}
      >
        Check backend
      </button>

      <p role="status">{status}</p>
    </main>
  )
}

export default App
