/*import  modules*/ 
import { useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

/* define props types*/
type LoginPageProps = {
  onSubmit: (credentials: {
    email: string
    password: string
  }) => Promise<void>
  loading?: boolean
  error?: string
  onRegisterClick: () => void
}

/* creat LoginPage component*/
export function LoginPage({
  onSubmit,
  loading = false,
  error,
  onRegisterClick,
}: LoginPageProps) {
  /* save the state from user input*/
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState('')

  /* handle form submit*/
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')

    const normalizedEmail = email.trim()

    if (!normalizedEmail || !password) {
      setValidationError('Please enter your email and password.')
      return
    }

    try {
      await onSubmit({
        email: normalizedEmail,
        password,
      })
    } catch {
      // The parent component is responsible for displaying API errors.
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
            Welcome back
          </h2>
          <p className="text-muted mt-1">
            Sign in to continue to your trips.
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
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={password}
            disabled={loading}
            onChange={(event) => {
              setPassword(event.currentTarget.value)
              setValidationError('')
            }}
          />

          {(validationError || error) && (
            <p role="alert" className="text-small text-danger">
              {validationError || error}
            </p>
          )}


          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
            disabled={loading}
          >
            Sign in
          </Button>
        </form>

        <p className="text-small text-muted text-center">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onRegisterClick}
            disabled={loading}
            className="font-medium text-brand underline"
          >
            Create account
          </button>
        </p>
      </Card>
    </main>
  )
}
