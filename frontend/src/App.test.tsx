// @vitest-environment jsdom

import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import App from './App'

// Exposes the current route path for tests.
function CurrentPath() {
    const location = useLocation()

    return <output aria-label="Current path">{location.pathname}</output>
}

// Starts each test without an authenticated session.
beforeEach(() => {
    const fakeFetch = vi.fn().mockResolvedValue(
        new Response(
            JSON.stringify({
                error: {
                    code: 'AUTHENTICATION_REQUIRED',
                    message: 'Authentication required',
                    details: {},
                },
            }),
            {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            },
        ),
    )

    vi.stubGlobal('fetch', fakeFetch)
})

// Removes rendered components after each test.
afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

// Shows login after checking the session.
it('renders the login page at /login', async () => {
    render(
        <MemoryRouter initialEntries={['/login']}>
            <App />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Welcome back' })
})

// Shows the registration page at /register.
it('renders the registration page at /register', async () => {
    render(
        <MemoryRouter initialEntries={['/register']}>
            <App />
        </MemoryRouter>
    )

    await screen.findByRole('heading', { name: 'Create your account' })
})

// Shows the fallback page when no route matches.
it('renders the not-found page for an unknown path', async () => {
    render(
        <MemoryRouter initialEntries={['/unknown-page']}>
            <App />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Page not found' })
})

// Redirects the root path to /login.
it('redirects / to /login', async () => {
    render(
        <MemoryRouter initialEntries={['/']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Welcome back' })

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/login')
})

// Navigates from login to registration when the button is clicked.
it('navigates to registration from the login page', async () => {
    render(
        <MemoryRouter initialEntries={['/login']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Welcome back' })

    fireEvent.click(
        screen.getByRole('button', { name: 'Create account' }),
    )

    await screen.findByRole('heading', { name: 'Create your account' })

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/register')
})

// Navigates from registration back to login.
it('navigates to login from the registration page', async () => {
    render(
        <MemoryRouter initialEntries={['/register']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Create your account' })

    fireEvent.click(
        screen.getByRole('button', { name: 'Sign in' }),
    )

    await screen.findByRole('heading', { name: 'Welcome back' })

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/login')
})

// Restores the current user when opening the home page.
it('restores an authenticated user at /home', async () => {
    const fakeFetch = vi.fn().mockResolvedValue(
        new Response(
            JSON.stringify({
                user: {
                    id: 'test-user-id',
                    email: 'test-user@example.com',
                    username: 'test-user',
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            },
        ),
    )

    vi.stubGlobal('fetch', fakeFetch)

    render(
        <MemoryRouter initialEntries={['/home']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    await screen.findByText('test-user')

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/home')

    expect(fakeFetch).toHaveBeenCalledWith('/api/auth/me', {
        credentials: 'same-origin',
    })
})

// Redirects unauthenticated users to login.
it('redirects unauthenticated users from /home to /login', async () => {
    render(
        <MemoryRouter initialEntries={['/home']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Welcome back' })

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/login')
})

// Shows a session error when the server fails.
it('shows an error when the session check fails', async () => {
    const fakeFetch = vi.fn().mockResolvedValue(
        new Response(null, {
            status: 500,
        }),
    )

    vi.stubGlobal('fetch', fakeFetch)

    render(
        <MemoryRouter initialEntries={['/home']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    const alert = await screen.findByRole('alert')

    expect(alert.textContent).toBe(
        'Unable to check your session. Please try again.',
    )

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/home')
})

// Returns to login after successful logout.
it('logs out and redirects to login', async () => {
    const fakeFetch = vi.fn()
        .mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    user: {
                        id: 'test-user-id',
                        email: 'test-user@example.com',
                        username: 'test-user',
                    },
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                },
            ),
        )
        .mockResolvedValueOnce(
            new Response(null, {
                status: 204,
            }),
        )

    vi.stubGlobal('fetch', fakeFetch)

    render(
        <MemoryRouter initialEntries={['/home']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    const button = await screen.findByRole('button', {
        name: 'Sign out',
    })

    fireEvent.click(button)

    await screen.findByRole('heading', { name: 'Welcome back' })

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/login')

    expect(fakeFetch).toHaveBeenNthCalledWith(2, '/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
    })
})

// Keeps the current user when logout fails.
it('shows an error and stays signed in when logout fails', async () => {
    const fakeFetch = vi.fn()
        .mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    user: {
                        id: 'test-user-id',
                        email: 'test-user@example.com',
                        username: 'test-user',
                    },
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                },
            ),
        )
        .mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Unable to sign out.',
                        details: {},
                    },
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                },
            ),
        )

    vi.stubGlobal('fetch', fakeFetch)

    render(
        <MemoryRouter initialEntries={['/home']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    const button = await screen.findByRole('button', {
        name: 'Sign out',
    })

    fireEvent.click(button)

    const alert = await screen.findByRole('alert')

    expect(alert.textContent).toBe('Unable to sign out.')
    expect(screen.getByText('test-user')).not.toBeNull()

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/home')

    expect(button.hasAttribute('disabled')).toBe(false)
})

// Submits registration details and shows success.
it('registers a user through the registration page', async () => {
    render(
        <MemoryRouter initialEntries={['/register']}>
            <App />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', {
        name: 'Create your account',
    })

    // Replaces fetch after the initial session check.
    const fakeFetch = vi.fn().mockResolvedValue(
        new Response(
            JSON.stringify({
                user: {
                    id: 'test-user-id',
                    email: 'test-user@example.com',
                    username: 'test-user',
                },
            }),
            {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            },
        ),
    )

    vi.stubGlobal('fetch', fakeFetch)

    fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test-user@example.com' },
    })

    fireEvent.change(screen.getByLabelText('Username'), {
        target: { value: 'test-user' },
    })

    fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'example-password' },
    })

    fireEvent.change(screen.getByLabelText('Confirm password'), {
        target: { value: 'example-password' },
    })

    fireEvent.click(
        screen.getByRole('button', { name: 'Create account' }),
    )

    await screen.findByText('Account created. Please sign in.')

    expect(fakeFetch).toHaveBeenCalledTimes(1)

    expect(fakeFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
            email: 'test-user@example.com',
            username: 'test-user',
            password: 'example-password',
        }),
    })
})

// Displays the backend error when registration fails.
it('shows an error when the registration email already exists', async () => {
    render(
        <MemoryRouter initialEntries={['/register']}>
            <App />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', {
        name: 'Create your account',
    })

    const fakeFetch = vi.fn().mockResolvedValue(
        new Response(
            JSON.stringify({
                error: {
                    code: 'EMAIL_ALREADY_EXISTS',
                    message: 'Email already exists',
                    details: {},
                },
            }),
            {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
            },
        ),
    )

    vi.stubGlobal('fetch', fakeFetch)

    fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test-user@example.com' },
    })

    fireEvent.change(screen.getByLabelText('Username'), {
        target: { value: 'test-user' },
    })

    fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'example-password' },
    })

    fireEvent.change(screen.getByLabelText('Confirm password'), {
        target: { value: 'example-password' },
    })

    fireEvent.click(
        screen.getByRole('button', { name: 'Create account' }),
    )

    const alert = await screen.findByRole('alert')

    expect(alert.textContent).toBe('Email already exists')

    expect(
        screen.queryByText('Account created. Please sign in.'),
    ).toBeNull()

    expect(
        screen.getByRole('button', { name: 'Create account' })
            .hasAttribute('disabled'),
    ).toBe(false)
})

// Displays the backend error when the registration username already exists.
it('shows an error when the registration username already exists', async () => {
    render(
        <MemoryRouter initialEntries={['/register']}>
            <App />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', {
        name: 'Create your account',
    })

    const fakeFetch = vi.fn().mockResolvedValue(
        new Response(
            JSON.stringify({
                error: {
                    code: 'USERNAME_ALREADY_EXISTS',
                    message: 'Username already exists',
                    details: {},
                },
            }),
            {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
            },
        ),
    )

    vi.stubGlobal('fetch', fakeFetch)

    fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'another-user@example.com' },
    })

    fireEvent.change(screen.getByLabelText('Username'), {
        target: { value: 'existing-user' },
    })

    fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'example-password' },
    })

    fireEvent.change(screen.getByLabelText('Confirm password'), {
        target: { value: 'example-password' },
    })

    fireEvent.click(
        screen.getByRole('button', { name: 'Create account' }),
    )

    const alert = await screen.findByRole('alert')

    expect(alert.textContent).toBe('Username already exists')

    expect(
        screen.queryByText('Account created. Please sign in.'),
    ).toBeNull()

    expect(
        screen.getByRole('button', { name: 'Create account' })
            .hasAttribute('disabled'),
    ).toBe(false)
})

// Signs in through the login page and opens home.
it('logs in and navigates to home', async () => {
    render(
        <MemoryRouter initialEntries={['/login']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', {
        name: 'Welcome back',
    })

    const fakeFetch = vi.fn().mockResolvedValue(
        new Response(
            JSON.stringify({
                user: {
                    id: 'test-user-id',
                    email: 'test-user@example.com',
                    username: 'test-user',
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            },
        ),
    )

    vi.stubGlobal('fetch', fakeFetch)

    fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test-user@example.com' },
    })

    fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'example-password' },
    })

    fireEvent.click(
        screen.getByRole('button', { name: 'Sign in' }),
    )

    await screen.findByRole('heading', { name: 'Signed in' })

    expect(screen.getByText('test-user')).not.toBeNull()

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/home')

    expect(fakeFetch).toHaveBeenCalledTimes(1)

    expect(fakeFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
            email: 'test-user@example.com',
            password: 'example-password',
        }),
    })
})

// Keeps the user on login when credentials are invalid.
it('shows an error when login credentials are invalid', async () => {
    render(
        <MemoryRouter initialEntries={['/login']}>
            <App />
            <CurrentPath />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', {
        name: 'Welcome back',
    })

    const fakeFetch = vi.fn().mockResolvedValue(
        new Response(
            JSON.stringify({
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password',
                    details: {},
                },
            }),
            {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            },
        ),
    )

    vi.stubGlobal('fetch', fakeFetch)

    fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test-user@example.com' },
    })

    fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'wrong-password' },
    })

    fireEvent.click(
        screen.getByRole('button', { name: 'Sign in' }),
    )

    const alert = await screen.findByRole('alert')

    expect(alert.textContent).toBe('Invalid email or password')

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/login')

    expect(
        screen.queryByRole('heading', { name: 'Signed in' }),
    ).toBeNull()

    expect(
        screen.getByRole('button', { name: 'Sign in' })
            .hasAttribute('disabled'),
    ).toBe(false)
})

// Shows a validation error without sending a login request.
it('blocks login when the password is too short', async () => {
    render(
        <MemoryRouter initialEntries={['/login']}>
            <App />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Welcome back' })

    fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'alice@example.com' },
    })

    fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: '1234567' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByRole('alert').textContent).toBe(
        'Password must contain at least 8 characters.',
    )
    expect(fetch).toHaveBeenCalledTimes(1)
})

// Shows a validation error without sending a registration request.
it('blocks registration when the password exceeds 72 UTF-8 bytes', async () => {
    render(
        <MemoryRouter initialEntries={['/register']}>
            <App />
        </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Create your account' })

    const password = '中'.repeat(24) + 'a'

    fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'alice@example.com' },
    })

    fireEvent.change(screen.getByLabelText('Username'), {
        target: { value: 'alice' },
    })

    fireEvent.change(screen.getByLabelText('Password', { exact: true }), {
        target: { value: password },
    })

    fireEvent.change(screen.getByLabelText('Confirm password'), {
        target: { value: password },
    })

    fireEvent.click(
        screen.getByRole('button', { name: 'Create account' }),
    )

    expect(screen.getByRole('alert').textContent).toBe(
        'Password must not exceed 72 UTF-8 bytes.',
    )
    expect(fetch).toHaveBeenCalledTimes(1)
})
