// Data sent when registering a user.
export interface RegisterInput {
    email: string
    username: string
    password: string
}

// Data sent when logging in.
export interface LoginInput {
    email: string
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

// Successful login response.
export interface LoginResponse {
    user: CurrentUser
}

// Successful current-user response.
export interface MeResponse {
    user: CurrentUser
}

// Error information returned by the backend.
export interface AuthErrorResponse {
    error: {
        code: string
        message: string
    }
}

// Keeps the backend error code alongside its message.
export class AuthApiError extends Error {
    code: string
    
    constructor(message: string, code: string) {
        super(message)
        this.name = 'AuthApiError'
        this.code = code
    }
}

// Reads backend errors and falls back to a generic HTTP error.
async function readApiError(response: Response): Promise<AuthApiError> {
    let message = `Request failed (HTTP ${response.status})`
    let code = 'HTTP_ERROR'
    try {
        const data: AuthErrorResponse = await response.json()
        if (
            typeof data.error.code === 'string' &&
            typeof data.error.message === 'string'
        ) {
            code = data.error.code
            message = data.error.message
        }
    } catch {
        // Keep the default error if the response cannot be read as expected.
    }
    return new AuthApiError(message, code)
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
        throw await readApiError(response)
    }
    const data: RegisterResponse = await response.json()
    return data
}

// Sends login credentials to the backend.
export async function login(input: LoginInput): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    })
    if (!response.ok) {
        throw await readApiError(response)
    }
    const data: LoginResponse = await response.json()
    return data
}

// Loads the currently authenticated user.
export async function getMe(): Promise<MeResponse> {
    const response = await fetch('/api/auth/me')
    if (!response.ok) {
        throw await readApiError(response)
    }
    const data: MeResponse = await response.json()
    return data
}

// Asks the backend to end the current session.
export async function logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
        method: 'POST',
    })
    if (!response.ok) {
        throw await readApiError(response)
    }
}
