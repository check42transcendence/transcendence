import type { RealtimeEnvelope, ActivityRealtimeEventName, } from '@tripcollab/shared'
import type { RealtimeSocket } from './socket'

// Adding a name to the shared contract type makes this object fail to compile
// until the runtime list below includes it as well.
const EVENT_NAMES = {
	'activity:created': true,
	'activity:updated': true,
	'activity:deleted': true,
} satisfies Record<ActivityRealtimeEventName, true>

export const REALTIME_EVENT_NAMES = Object.keys(
	EVENT_NAMES,
) as ActivityRealtimeEventName[]

// How long to wait for the server to answer trip:subscribe.
export const SUBSCRIBE_ACK_TIMEOUT_MS = 5000

// idle: waiting for a connection; failed: the server refused or did not answer.
export type TripSubscriptionStatus =
	'idle' | 'subscribing' | 'subscribed' | 'failed'

export interface TripRealtimeHandlers {
	onEvent?: (
		eventName: ActivityRealtimeEventName,
		envelope: RealtimeEnvelope<unknown>,
	) => void
	onStatusChange?: (status: TripSubscriptionStatus) => void
}

export interface TripRealtimeController {
	// Returns a function that releases this subscription.
	subscribe: (tripId: string, handlers: TripRealtimeHandlers) => () => void
	getStatus: (tripId: string) => TripSubscriptionStatus
	// Drops every subscription locally, for logout.
	reset: () => void
}

interface TripRecord {
	tripId: string
	handlers: Set<TripRealtimeHandlers>
	status: TripSubscriptionStatus
	// Incremented for each request and on disconnect, to ignore stale acks.
	attempt: number
}

// Create the one controller that owns Trip subscriptions for a socket.
export function createTripRealtime(
	getSocket: () => RealtimeSocket,
): TripRealtimeController {
	const records = new Map<string, TripRecord>()
	let attachedSocket: RealtimeSocket | null = null

	// One stable listener per event name, so listeners never accumulate.
	const eventListeners = new Map(
		REALTIME_EVENT_NAMES.map((name) => [
			name,
			(envelope: RealtimeEnvelope<unknown>) => dispatch(name, envelope),
		]),
	)

	// Listen to the socket only while at least one Trip is subscribed.
	function attach(): void {
		if (attachedSocket) return

		const socket = getSocket()

		socket.on('connect', handleConnect)
		socket.on('disconnect', handleDisconnect)
		for (const [name, listener] of eventListeners) {
			socket.on(name, listener)
		}

		attachedSocket = socket
	}

	function detach(): void {
		if (!attachedSocket) return

		const socket = attachedSocket

		socket.off('connect', handleConnect)
		socket.off('disconnect', handleDisconnect)
		for (const [name, listener] of eventListeners) {
			socket.off(name, listener)
		}

		attachedSocket = null
	}

	function detachIfUnused(): void {
		if (records.size === 0) detach()
	}

	function setStatus(record: TripRecord, status: TripSubscriptionStatus) {
		if (record.status === status) return

		record.status = status

		for (const handlers of [...record.handlers]) {
			try {
				handlers.onStatusChange?.(status)
			} catch (error) {
				console.error('Realtime status handler failed', error)
			}
		}
	}

	// Deliver an event to the handlers of the Trip named in its envelope.
	function dispatch(
		eventName: ActivityRealtimeEventName,
		envelope: RealtimeEnvelope<unknown>,
	): void {
		if (typeof envelope?.tripId !== 'string') return

		const record = records.get(envelope.tripId)
		if (!record) return

		for (const handlers of [...record.handlers]) {
			try {
				handlers.onEvent?.(eventName, envelope)
			} catch (error) {
				console.error('Realtime event handler failed', error)
			}
		}
	}

	function emitUnsubscribe(tripId: string): void {
		if (!attachedSocket?.connected) return

		attachedSocket.emit('trip:unsubscribe', { tripId }, () => undefined)
	}

	// Ask the server to join the Trip room, or wait until connected.
	function requestSubscribe(record: TripRecord): void {
		const socket = attachedSocket

		if (!socket?.connected) {
			setStatus(record, 'idle')
			return
		}

		record.attempt += 1
		const attempt = record.attempt

		setStatus(record, 'subscribing')

		socket
			.timeout(SUBSCRIBE_ACK_TIMEOUT_MS)
			.emit('trip:subscribe', { tripId: record.tripId }, (error, ack) => {
				// Ignore answers for a record or request that no longer counts.
				if (
					records.get(record.tripId) !== record ||
					record.attempt !== attempt
				) {
					return
				}

				handleAck(record, !error && ack?.ok === true)
			})
	}

	function handleAck(record: TripRecord, ok: boolean): void {
		if (record.handlers.size === 0) {
			// Everyone left while the request was in flight. The server only
			// joins the room after its membership check, so leave it now.
			if (ok) emitUnsubscribe(record.tripId)

			records.delete(record.tripId)
			detachIfUnused()
			return
		}

		setStatus(record, ok ? 'subscribed' : 'failed')
	}

	// A new connection is a new server socket with no rooms, so subscribe again.
	function handleConnect(): void {
		for (const record of [...records.values()]) {
			if (record.handlers.size === 0) {
				records.delete(record.tripId)
				continue
			}

			requestSubscribe(record)
		}

		detachIfUnused()
	}

	function handleDisconnect(): void {
		for (const record of [...records.values()]) {
			record.attempt += 1

			if (record.handlers.size === 0) {
				records.delete(record.tripId)
				continue
			}

			setStatus(record, 'idle')
		}

		detachIfUnused()
	}

	function release(record: TripRecord, handlers: TripRealtimeHandlers): void {
		record.handlers.delete(handlers)

		// Another consumer, or a reset, already decided this record's fate.
		if (records.get(record.tripId) !== record) return
		if (record.handlers.size > 0) return

		// While a request is in flight, wait for its answer. Leaving now could
		// be overtaken by the server joining the room afterwards.
		if (record.status === 'subscribing') return

		if (record.status === 'subscribed') emitUnsubscribe(record.tripId)

		records.delete(record.tripId)
		detachIfUnused()
	}

	return {
		subscribe(tripId, handlers) {
			attach()

			let record = records.get(tripId)

			if (record) {
				record.handlers.add(handlers)

				if (record.status === 'failed') {
					requestSubscribe(record)
				} else {
					handlers.onStatusChange?.(record.status)
				}
			} else {
				record = {
					tripId,
					handlers: new Set([handlers]),
					status: 'idle',
					attempt: 0,
				}
				records.set(tripId, record)
				requestSubscribe(record)
			}

			const owner = record
			let active = true

			return () => {
				if (!active) return
				active = false

				release(owner, handlers)
			}
		},

		getStatus(tripId) {
			return records.get(tripId)?.status ?? 'idle'
		},

		reset() {
			records.clear()
			detach()
		},
	}
}