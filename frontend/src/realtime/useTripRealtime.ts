import { useEffect, useRef } from 'react'
import { tripRealtime } from './client'
import type {
	TripRealtimeController,
	TripRealtimeHandlers,
} from './trip_realtime'

// Subscribe to one Trip while the calling component is mounted.
// Passing no tripId subscribes to nothing.
export function useTripRealtime(
	tripId: string | undefined,
	handlers: TripRealtimeHandlers,
	controller: TripRealtimeController = tripRealtime,
): void {
	// Keep the newest handlers without resubscribing on every render.
	const handlersRef = useRef(handlers)

	useEffect(() => {
		handlersRef.current = handlers
	})

	useEffect(() => {
		if (!tripId) return

		return controller.subscribe(tripId, {
			onEvent: (eventName, envelope) =>
				handlersRef.current.onEvent?.(eventName, envelope),
			onStatusChange: (status) =>
				handlersRef.current.onStatusChange?.(status),
		})
	}, [tripId, controller])
}