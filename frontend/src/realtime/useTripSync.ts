import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeEnvelope, RealtimeEventName } from '@tripcollab/shared'
import { tripSync } from './client'
import type {
    TripSync,
    TripSyncHandle,
    TripSyncListeners,
    TripSyncSource,
    TripSyncStatus,
} from './trip_sync'

// Keep one feature's state in sync with a Trip while the component is mounted:
// load a snapshot, follow live events, and reload after every reconnect.
export function useTripSync<TSnapshot>(
    tripId: string | undefined,
    source: TripSyncSource<TSnapshot>,
    listeners: TripSyncListeners = {},
    sync: TripSync = tripSync,
) {
    // The status is stored with its Trip, so a status from the previous Trip
    // is never shown for the new one.
    const [tracked, setTracked] = useState<{
        tripId: string | undefined
        status: TripSyncStatus
    }>({ tripId, status: 'syncing' })
    const status = tracked.tripId === tripId ? tracked.status : 'syncing'
    const handleRef = useRef<TripSyncHandle | null>(null)

    // Keep the newest callbacks without restarting the sync on every render.
    const sourceRef = useRef(source)
    const listenersRef = useRef(listeners)

    useEffect(() => {
        sourceRef.current = source
        listenersRef.current = listeners
    })

    useEffect(() => {
        if (!tripId) return

        const handle = sync.start(
            tripId,
            {
                fetchSnapshot: () => sourceRef.current.fetchSnapshot(),
                applySnapshot: (snapshot) =>
                    sourceRef.current.applySnapshot(snapshot),
                applyEvent: (eventName, envelope) =>
                    sourceRef.current.applyEvent(eventName, envelope),
                clear: () => sourceRef.current.clear(),
            },
            {
                onStatusChange: (next) => {
                    setTracked({ tripId, status: next })
                    listenersRef.current.onStatusChange?.(next)
                },
                onAccessLost: (reason) =>
                    listenersRef.current.onAccessLost?.(reason),
            },
        )

        handleRef.current = handle

        // Access can end without any event, for example after Leave in another
        // tab or Trip deletion. Refetching when the tab is shown again finds out.
        function handleVisibility(): void {
            if (document.visibilityState === 'visible') handle.resync()
        }

        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility)
            handle.stop()
            handleRef.current = null
        }
    }, [tripId, sync])

    const resync = useCallback(() => handleRef.current?.resync(), [])

    const submit = useCallback(
        (eventName: RealtimeEventName, envelope: RealtimeEnvelope<unknown>) =>
            handleRef.current?.submit(eventName, envelope),
        [],
    )

    const reportError = useCallback(
        (error: unknown) => handleRef.current?.reportError(error),
        [],
    )

    return { status, resync, submit, reportError }
}