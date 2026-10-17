
import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'

function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(credentials: {
    email: string
    password: string
  }) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(
          data?.error?.message ?? 'Unable to sign in. Please try again.',
        )
      }

      window.location.assign('/home')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please try again.',
      )
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginPage
      onSubmit={handleLogin}
      loading={loading}
      error={error}
      onRegisterClick={() => {
        window.location.assign('/register')
      }}
    />
  )
}

export default App
