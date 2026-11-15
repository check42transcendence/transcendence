import { io, type Socket } from 'socket.io-client'
import type {
	ActivityServerToClientEvents,
	SubscriptionAck,
	TripSubscriptionPayload,
} from '@tripcollab/shared'

// Events the browser may send. Subscription changes are not domain writes.
export interface ClientToServerEvents {
	'trip:subscribe': (
		payload: TripSubscriptionPayload,
		ack: (response: SubscriptionAck) => void,
	) => void
	'trip:unsubscribe': (
		payload: TripSubscriptionPayload,
		ack: (response: SubscriptionAck) => void,
	) => void
}

// Proposal event payloads are added with #50/#62.
export type RealtimeSocket = Socket<
	ActivityServerToClientEvents,
	ClientToServerEvents
>

let socket: RealtimeSocket | null = null


// Return the one shared socket, creating it without connecting on first use.
export function getRealtimeSocket(): RealtimeSocket {
	if (!socket) {
		socket = io({
			// Same-origin: Vite or Nginx proxies this path to the backend.
			path: '/socket.io',
			// The HttpOnly JWT cookie is sent by the browser automatically.
			withCredentials: true,
			// Connection follows the signed-in user, not module loading.
			autoConnect: false,
		})
	}

	return socket
}

// Connect after login or session restore. Safe to call repeatedly.
export function connectRealtime(): void {
	const current = getRealtimeSocket()

	if (!current.connected && !current.active) {
		current.connect()
	}
}

// Disconnect on logout. The server does not close the socket for us.
export function disconnectRealtime(): void {
	socket?.disconnect()
}