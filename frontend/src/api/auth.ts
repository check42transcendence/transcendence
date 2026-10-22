import {
    apiClient,
    apiJson,
    apiPostJson
} from "../shared/api/api-client"

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

// Response containing public user information.
export interface UserResponse {
    user: CurrentUser
}

// Sends registration data to the backend.
export function register(input: RegisterInput): Promise<UserResponse> {
    return apiPostJson<UserResponse>('/auth/register', input)
}

// Sends login credentials to the backend.
export function login(input: LoginInput): Promise<UserResponse> {
    return apiPostJson<UserResponse>('/auth/login', input)
}

// Loads the currently authenticated user.
export function getMe(): Promise<UserResponse> {
    return apiJson<UserResponse>('/auth/me')
}

// Asks the backend to end the current session.
export async function logout(): Promise<void> {
    await apiClient('/auth/logout', {
        method: 'POST'
    })
}
