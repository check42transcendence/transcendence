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
