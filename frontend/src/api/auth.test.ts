import { afterEach, expect, it, vi } from 'vitest'
import { register } from './auth'
import type { RegisterInput } from './auth'

// Registration input shared by the tests.
const registerInput: RegisterInput = {
    email: 'test@example.com',
    username: 'test-user',
    password: 'example-password',
}

// Restores the real fetch after each test.
afterEach(() => {
    vi.unstubAllGlobals()
})

it('returns the user after successful registration', async () => {
    const expected = {
        user: {
            id: 'test-user-id',
            email: 'test@example.com',
            username: 'test-user',
        },
    }

    const fakeFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(expected), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        }),
    )

    vi.stubGlobal('fetch', fakeFetch)

    const result = await register(registerInput)

    expect(result).toEqual(expected)
    expect(fakeFetch).toHaveBeenCalledTimes(1)
    expect(fakeFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerInput),
    })
})

it('rejects registration when the email already exists', async () => {
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
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        ),
    )
    vi.stubGlobal('fetch', fakeFetch)
    await expect(
        register({
            ...registerInput,
            username: 'another-user',
        }),
    ).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email already exists',
    })
})

it('uses a default error when the server returns HTML', async () => {
    const fakeFetch = vi.fn().mockResolvedValue(
        new Response('<html>Bad Gateway</html>', {
            status: 502,
            headers: {
                'Content-Type': 'text/html',
            },
        })
    )
    vi.stubGlobal('fetch', fakeFetch)
    await expect(register(registerInput)).rejects.toMatchObject({
        code: 'HTTP_ERROR',
        message: 'Request failed (HTTP 502)',
    })
})
