import type { RealtimeSocket } from './socket'

export interface SessionGuardOptions {
    socket: RealtimeSocket
    // Ask the REST API whether the session is still valid (rejects with an
    // error that has a numeric `status`, such as ApiError, when it is not).
    verifySession: () => Promise<unknown>
    // The server no longer accepts this user's session.
    onAuthLost: () => void
    // First retry delay; it doubles after each failed attempt.
    retryDelayMs?: number
    maxRetryDelayMs?: number
    // Injectable for tests. Returns a function that cancels the timer.
    schedule?: (callback: () => void, delayMs: number) => () => void
}

function defaultSchedule(callback: () => void, delayMs: number): () => void {
    const timer = setTimeout(callback, delayMs)

    return () => clearTimeout(timer)
}

// Socket.IO retries by itself after network failures. It does not retry when
// the server rejects the handshake or closes the connection on purpose, so
// this guard handles those two cases: it asks REST whether the session is
// still valid, then either signs the user out or reconnects with a growing
// delay. Returns a function that removes the guard.
export function installSessionGuard(options: SessionGuardOptions): () => void {
    const {
        socket,
        verifySession,
        onAuthLost,
        retryDelayMs = 2000,
        maxRetryDelayMs = 30000,
        schedule = defaultSchedule,
    } = options

    let attempts = 0
    let checking = false
    let disposed = false
    let cancelRetry: (() => void) | null = null

    function scheduleReconnect(): void {
        if (disposed || cancelRetry) return

        const delay = Math.min(retryDelayMs * 2 ** attempts, maxRetryDelayMs)

        attempts += 1

        cancelRetry = schedule(() => {
            cancelRetry = null

            if (!disposed && !socket.connected) socket.connect()
        }, delay)
    }

    // Never reconnect blindly: an expired session would only be rejected again.
    async function recover(): Promise<void> {
        if (checking || disposed) return

        checking = true

        try {
            await verifySession()

            // The session is valid, so the problem was probably temporary.
            scheduleReconnect()
        } catch (error) {
            const status = (error as { status?: unknown } | null)?.status

            if (status === 401) {
                if (!disposed) onAuthLost()
            } else {
                // The check failed for another reason, such as no network.
                scheduleReconnect()
            }
        } finally {
            checking = false
        }
    }

    function handleConnectError(): void {
        // Still trying to reconnect by itself: a temporary failure.
        if (socket.active) return

        void recover()
    }

    function handleDisconnect(reason: string): void {
        // The server closed the connection, so the client will not retry.
        if (reason === 'io server disconnect') void recover()
    }

    function handleConnect(): void {
        attempts = 0
    }

    socket.on('connect_error', handleConnectError)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect', handleConnect)

    return () => {
        disposed = true
        cancelRetry?.()
        cancelRetry = null

        socket.off('connect_error', handleConnectError)
        socket.off('disconnect', handleDisconnect)
        socket.off('connect', handleConnect)
    }
}