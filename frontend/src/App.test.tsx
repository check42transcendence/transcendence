// @vitest-environment jsdom

import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import App from './App'

// Exposes the current route path for tests.
function CurrentPath() {
    const location = useLocation()

    return <output aria-label="Current path">{location.pathname}</output>
}

// Removes rendered components after each test.
afterEach(() => {
    cleanup()
})

// Shows the login page when the current path is /login.
it('renders the login page at /login', () => {
    render(
        <MemoryRouter initialEntries={['/login']}>
            <App />
        </MemoryRouter>,
    )

    expect(
        screen.queryByRole('heading', { name: 'Welcome back' }),
    ).not.toBeNull()
})

// Shows the registration page at /register.
it('renders the registration page at /register', () => {
    render(
        <MemoryRouter initialEntries={['/register']}>
            <App />
        </MemoryRouter>
    )

    expect(
        screen.queryByRole('heading', { name: 'Create your account' }),
    ).not.toBeNull()
})

// Shows the fallback page when no route matches.
it('renders the not-found page for an unknown path', () => {
    render(
        <MemoryRouter initialEntries={['/unknown-page']}>
            <App />
        </MemoryRouter>,
    )

    expect(
        screen.queryByRole('heading', { name: 'Page not found' }),
    ).not.toBeNull()
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

    fireEvent.click(
        screen.getByRole('button', { name: 'Sign in' }),
    )

    await screen.findByRole('heading', { name: 'Welcome back' })

    expect(
        screen.getByLabelText('Current path').textContent,
    ).toBe('/login')
})
