
import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

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
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <LoginPage
            onSubmit={handleLogin}
            loading={loading}
            error={error}
            onRegisterClick={() => navigate('/register')}
          />
        }
      />

      <Route
        path="/register"
        element={
          <RegisterPage
            onSubmit={async (credentials) => {
              console.log('Register form submitted:', {
                email: credentials.email,
                username: credentials.username,
              })
            }}
            onLoginClick={() => navigate('/login')}
          />
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
