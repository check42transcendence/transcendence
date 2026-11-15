import type { RealtimeSocket } from './socket'

export interface SessionGuardOptions {
	socket: RealtimeSocket
	// Ask the REST API whether the session is still valid (rejects with an
	// error that has a numeric `status`, such as ApiError, when it is not).
	verifySession: () => Promise<unknown>
	// The server no longer accepts this user's session.
	onAuthLost: () => void
	retryDelayMs?: number
	maxRetries?: number
	// Injectable for tests. Returns a function that cancels the timer.
	schedule?: (callback: () => void, delayMs: number) => () => void
}

function defaultSchedule(callback: () => void, delayMs: number): () => void {
	const timer = setTimeout(callback, delayMs)

	return () => clearTimeout(timer)
}

// Socket.IO retries by itself after network failures. It does not retry when
// the server rejects the handshake or closes the connection on purpose, so
// this guard handles those two cases. Returns a function that removes it.
export function installSessionGuard(options: SessionGuardOptions): () => void {
	const {
		socket,
		verifySession,
		onAuthLost,
		retryDelayMs = 3000,
		maxRetries = 3,
		schedule = defaultSchedule,
	} = options

	let retries = 0
	let checking = false
	let disposed = false
	let cancelRetry: (() => void) | null = null

	function scheduleReconnect(): void {
		if (disposed || retries >= maxRetries || cancelRetry) return

		retries += 1

		cancelRetry = schedule(() => {
			cancelRetry = null

			if (!disposed) socket.connect()
		}, retryDelayMs)
	}

	async function handleRejected(): Promise<void> {
		if (checking) return

		checking = true

		try {
			await verifySession()

			// The session is valid, so the rejection was probably temporary.
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
		if (socket.active || disposed) return

		void handleRejected()
	}

	function handleDisconnect(reason: string): void {
		// The server closed the connection, so the client will not retry.
		if (reason === 'io server disconnect') scheduleReconnect()
	}

	function handleConnect(): void {
		retries = 0
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