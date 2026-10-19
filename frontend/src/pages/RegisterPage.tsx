
import { useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

type RegisterCredentials = {
  email: string
  username: string
  password: string
}

type RegisterPageProps = {
  onSubmit: (credentials: RegisterCredentials) => Promise<void>
  loading?: boolean
  error?: string
  success?: string
  onLoginClick: () => void
}

export function RegisterPage({
  onSubmit,
  loading = false,
  error,
  success,
  onLoginClick,
}: RegisterPageProps) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')

    const normalizedEmail = email.trim()
    const normalizedUsername = username.trim()

    if (!normalizedEmail || !normalizedUsername || !password || !confirmPassword) {
      setValidationError('Please complete all fields.')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }

    try {
      await onSubmit({
        email: normalizedEmail,
        username: normalizedUsername,
        password,
      })
    } catch {
      // The parent component displays API errors.
    }
  }

  return (
    <main className="mx-auto max-w-[440px] px-4 py-12">
      <header className="mb-6 text-center">
        <h1 className="text-page-title">Travel Planner</h1>
        <p className="text-muted mt-2">
          Plan your next trip together.
        </p>
      </header>

      <Card className="space-y-5">
        <div>
          <h2 className="text-card-title font-medium">
            Create your account
          </h2>
          <p className="text-muted mt-1">
            Sign up to start planning trips with friends.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={254}
            value={email}
            disabled={loading}
            onChange={(event) => {
              setEmail(event.currentTarget.value)
              setValidationError('')
            }}
          />

          <Input
            label="Username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            required
            value={username}
            disabled={loading}
            onChange={(event) => {
              setUsername(event.currentTarget.value)
              setValidationError('')
            }}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            required
            value={password}
            disabled={loading}
            onChange={(event) => {
              setPassword(event.currentTarget.value)
              setValidationError('')
            }}
          />

          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Enter your password again"
            required
            value={confirmPassword}
            disabled={loading}
            onChange={(event) => {
              setConfirmPassword(event.currentTarget.value)
              setValidationError('')
            }}
          />

          {(validationError || error) && (
            <p role="alert" className="text-small text-danger">
              {validationError || error}
            </p>
          )}

          {success && (
            <p role="status" className="text-small">
              {success}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
            disabled={loading}
          >
            Create account
          </Button>
        </form>

        <p className="text-small text-muted text-center">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onLoginClick}
            disabled={loading}
            className="font-medium text-brand underline"
          >
            Sign in
          </button>
        </p>
      </Card>
    </main>
  )
}

