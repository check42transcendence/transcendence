// Error information returned by the backend.
interface ApiErrorResponse {
    error: {
        code: string
        message: string
    }
}

// Stores an API error's message, code, and HTTP status.
export class ApiError extends Error {
    code: string
    status: number

    constructor(message: string, code: string, status: number) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.status = status
    }
}

// Reads backend errors or uses a default HTTP error.
export async function readApiError(response: Response): Promise<ApiError> {
    let message = `Request failed (HTTP ${response.status})`
    let code = 'HTTP_ERROR'

    try {
        const data: ApiErrorResponse = await response.json()

        if (
            typeof data.error.code === 'string' &&
            typeof data.error.message === 'string'
        ) {
            message = data.error.message
            code = data.error.code
        }
    } catch {
        // Keep the default error if the response cannot be read as expected.
    }
    return new ApiError(message, code, response.status)
}
