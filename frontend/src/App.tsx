
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { NotFoundPage } from './pages/NotFoundPage'
import {
  register,
  login,
  getMe,
  logout,
  type RegisterInput,
  type LoginInput,
  type CurrentUser,
} from './api/auth'
import { ApiError } from './shared/api/api-error'

function App() {
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionError, setSessionError] = useState('')

  const [logoutLoading, setLogoutLoading] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const navigate = useNavigate()

  // Restores the current user when the app starts.
  useEffect(() => {
    let active = true

    async function loadCurrentUser(): Promise<void> {
      try {
        const result = await getMe()

        if (active) {
          setCurrentUser(result.user)
        }
      } catch (error) {
        if (!active) return

        if (error instanceof ApiError && error.status === 401) {
          setCurrentUser(null)
        } else {
          setSessionError('Unable to check your session. Please try again.')
        }
      } finally {
        if (active) {
          setCheckingSession(false)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      active = false
    }
  }, [])

  // Registers a user and displays the result.
  async function handleRegister(input: RegisterInput): Promise<void> {
    setRegisterLoading(true)
    setRegisterError('')
    setRegisterSuccess('')

    try {
      await register(input)
      setRegisterSuccess('Account created. Please sign in.')
    } catch (error) {
      setRegisterError(
        error instanceof Error
          ? error.message
          : 'Unable to create an account. Please try again.',
      )
    } finally {
      setRegisterLoading(false)
    }
  }

  // Logs in a user and opens the home page.
  async function handleLogin(input: LoginInput) {
    setLoginLoading(true)
    setLoginError('')

    try {
      const result = await login(input)
      setCurrentUser(result.user)
      navigate('/home', { replace: true })
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.',
      )
    } finally {
      setLoginLoading(false)
    }
  }

  // Clears the session and returns to login.
  async function handleLogout(): Promise<void> {
    setLogoutLoading(true)
    setLogoutError('')

    try {
      await logout()
      setCurrentUser(null)
      setLoginError('')
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : 'Unable to sign out. Please try again.',
      )
    } finally {
      setLogoutLoading(false)
    }
  }

  if (checkingSession) {
    return <p role="status">Checking session...</p>
  }

  if (sessionError) {
    return (
      <main>
        <p role="alert">{sessionError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <LoginPage
            onSubmit={handleLogin}
            loading={loginLoading}
            error={loginError}
            onRegisterClick={() => navigate('/register')}
          />
        }
      />

      <Route
        path="/register"
        element={
          <RegisterPage
            onSubmit={handleRegister}
            loading={registerLoading}
            error={registerError}
            success={registerSuccess}
            onLoginClick={() => navigate('/login')}
          />
        }
      />

      <Route
        path="/home"
        element={
          currentUser ? (
            <main>
              <h1>Signed in</h1>
              <p>{currentUser.username}</p>

              {logoutError && (
                <p role="alert">{logoutError}</p>
              )}

              <button
                type="button"
                disabled={logoutLoading}
                onClick={handleLogout}
              >
                {logoutLoading ? 'Signing out...' : 'Sign out'}
              </button>
            </main>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
