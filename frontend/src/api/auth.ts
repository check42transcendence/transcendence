// Data sent when registering a user.
export interface RegisterInput {
    email: string
    username: string
    password: string
}

// Public information about the current user.
export interface CurrentUser {
    id: string
    email: string
    username: string
}

// Successful registration response.
export interface RegisterResponse {
    user: CurrentUser
}

// Error information returned by the backend.
export interface AuthErrorResponse {
    error: {
        code: string
        message: string
    }
}

// Sends registration data to the backend.
export async function register(input: RegisterInput): Promise<RegisterResponse> {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    })
    if (!response.ok) {
        const data: AuthErrorResponse = await response.json()
        throw new Error(data.error.message)
    }
    const data: RegisterResponse = await response.json()
    return data
}
