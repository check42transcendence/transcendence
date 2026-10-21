
import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { NotFoundPage } from './pages/NotFoundPage'
import {
  register,
  login,
  type RegisterInput,
  type LoginInput,
} from './api/auth'

function App() {
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const navigate = useNavigate()

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
      await login(input)
      window.location.assign('/home')
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

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
