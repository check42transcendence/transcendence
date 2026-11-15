import type { RealtimeEnvelope, RealtimeEventName } from '@tripcollab/shared'
import type {
    TripRealtimeController,
    TripRealtimeHandlers,
    TripSubscriptionStatus,
} from './trip_realtime'

// Events kept while a snapshot is loading. Overflow triggers one more refetch.
export const MAX_BUFFERED_EVENTS = 500

// syncing: a REST snapshot is loading.
// connecting: data is loaded, the Trip subscription is not confirmed yet.
// live: data is loaded and the subscription is confirmed.
// unavailable: data is loaded, but the server refused or ignored the subscription.
// error: the latest snapshot request failed (not an access problem).
// access-lost: left, removed, Trip deleted, or signed out. Terminal.
export type TripSyncStatus =
    | 'syncing'
    | 'connecting'
    | 'live'
    | 'unavailable'
    | 'error'
    | 'access-lost'

export type AccessLostReason = 'no-access' | 'unauthenticated'

// What a feature (Activity now, Proposal later) provides to the coordinator.
export interface TripSyncSource<TSnapshot> {
    // Authoritative REST read of the feature's current state.
    fetchSnapshot: () => Promise<TSnapshot>
    // Replace local state with a snapshot.
    applySnapshot: (snapshot: TSnapshot) => void
    // Apply one committed event. Must be idempotent and version-aware.
    applyEvent: (
        eventName: RealtimeEventName,
        envelope: RealtimeEnvelope<unknown>,
    ) => void
    // Drop protected data when access is lost.
    clear: () => void
}

export interface TripSyncListeners {
    onStatusChange?: (status: TripSyncStatus) => void
    onAccessLost?: (reason: AccessLostReason) => void
}

export interface TripSyncHandle {
    getStatus: () => TripSyncStatus
    // Refetch the authoritative state, for example from a Retry button.
    resync: () => void
    // Route the committed result of this user's own REST write through the
    // same pipeline as socket events.
    submit: (
        eventName: RealtimeEventName,
        envelope: RealtimeEnvelope<unknown>,
    ) => void
    // Report an error from any other REST call so lost access is noticed.
    reportError: (error: unknown) => void
    stop: () => void
}

export interface TripSync {
    start: <TSnapshot>(
        tripId: string,
        source: TripSyncSource<TSnapshot>,
        listeners?: TripSyncListeners,
    ) => TripSyncHandle
}

// Decide from a REST error whether the user can no longer use this Trip.
// Codes follow the REST contract: 401 AUTHENTICATION_REQUIRED, 403
// MEMBERSHIP_REQUIRED or ACCESS_DENIED, and 404 TRIP_NOT_FOUND.
export function classifyAccessError(error: unknown): AccessLostReason | null {
    if (typeof error !== 'object' || error === null) return null

    const { status, code } = error as { status?: unknown; code?: unknown }

    if (status === 401) return 'unauthenticated'

    if (
        status === 403 &&
        (code === 'MEMBERSHIP_REQUIRED' || code === 'ACCESS_DENIED')
    ) {
        return 'no-access'
    }

    if (status === 404 && code === 'TRIP_NOT_FOUND') return 'no-access'

    return null
}

type Phase = 'syncing' | 'synced' | 'error' | 'access-lost'

interface BufferedEvent {
    eventName: RealtimeEventName
    envelope: RealtimeEnvelope<unknown>
}

// Build the coordinator that keeps REST snapshots and socket events consistent.
export function createTripSync(controller: TripRealtimeController): TripSync {
    return {
        start<TSnapshot>(
            tripId: string,
            source: TripSyncSource<TSnapshot>,
            listeners: TripSyncListeners = {},
        ): TripSyncHandle {
            let phase: Phase = 'syncing'
            let subscription: TripSubscriptionStatus = 'idle'
            let generation = 0
            let stopped = false
            let buffer: BufferedEvent[] = []
            let overflowed = false
            let lastStatus: TripSyncStatus | null = null
            let release: () => void = () => undefined

            function derive(): TripSyncStatus {
                if (phase === 'access-lost') return 'access-lost'
                if (phase === 'syncing') return 'syncing'
                if (phase === 'error') return 'error'
                if (subscription === 'subscribed') return 'live'
                if (subscription === 'failed') return 'unavailable'
                return 'connecting'
            }

            function notify(): void {
                const status = derive()
                if (status === lastStatus) return

                lastStatus = status

                try {
                    listeners.onStatusChange?.(status)
                } catch (error) {
                    console.error('Trip sync status listener failed', error)
                }
            }

            function safeApply(
                eventName: RealtimeEventName,
                envelope: RealtimeEnvelope<unknown>,
            ): void {
                try {
                    source.applyEvent(eventName, envelope)
                } catch (error) {
                    console.error('Trip sync event handler failed', error)
                }
            }

            // Events and own write results wait while a snapshot is loading, so
            // an older snapshot can never overwrite them.
            function deliver(
                eventName: RealtimeEventName,
                envelope: RealtimeEnvelope<unknown>,
            ): void {
                if (stopped || phase === 'access-lost') return

                if (phase === 'syncing') {
                    if (buffer.length >= MAX_BUFFERED_EVENTS) {
                        overflowed = true
                        return
                    }

                    buffer.push({ eventName, envelope })
                    return
                }

                safeApply(eventName, envelope)
            }

            function loseAccess(reason: AccessLostReason): void {
                if (phase === 'access-lost') return

                generation += 1
                buffer = []
                phase = 'access-lost'

                release()

                try {
                    source.clear()
                } catch (error) {
                    console.error('Trip sync clear failed', error)
                }

                notify()

                try {
                    listeners.onAccessLost?.(reason)
                } catch (error) {
                    console.error('Trip sync access listener failed', error)
                }
            }

            // Load the authoritative snapshot, then replay what arrived meanwhile.
            async function sync(): Promise<void> {
                if (stopped || phase === 'access-lost') return

                generation += 1
                const mine = generation

                // Anything buffered earlier was committed before this read starts.
                buffer = []
                overflowed = false
                phase = 'syncing'
                notify()

                let snapshot: TSnapshot

                try {
                    snapshot = await source.fetchSnapshot()
                } catch (error) {
                    // A newer sync, a stop, or lost access supersedes this one.
                    if (stopped || mine !== generation) return

                    const lost = classifyAccessError(error)

                    if (lost) {
                        loseAccess(lost)
                    } else {
                        phase = 'error'
                        notify()
                    }
                    return
                }

                if (stopped || mine !== generation) return

                try {
                    source.applySnapshot(snapshot)
                } catch (error) {
                    // The data was not applied, so do not report success or
                    // replay events on top of an unknown state.
                    console.error('Trip sync snapshot handler failed', error)

                    buffer = []
                    overflowed = false
                    phase = 'error'
                    notify()
                    return
                }

                const pending = buffer
                buffer = []
                phase = 'synced'

                // Event handlers compare versions, so events already contained
                // in the snapshot change nothing.
                for (const item of pending) {
                    safeApply(item.eventName, item.envelope)
                }

                const again = overflowed
                overflowed = false

                notify()

                if (again) void sync()
            }

            const handlers: TripRealtimeHandlers = {
                onEvent: (eventName, envelope) => deliver(eventName, envelope),
                onStatusChange: (next) => {
                    subscription = next

                    // Every confirmed (re)subscription is followed by a refetch.
                    // A refused one also refetches, to learn from REST whether
                    // access is gone or only live updates are unavailable.
                    if (next === 'subscribed' || next === 'failed') {
                        void sync()
                    } else {
                        notify()
                    }
                },
            }

            release = controller.subscribe(tripId, handlers)

            // Load data right away, even if the socket never connects.
            if (generation === 0) void sync()

            return {
                getStatus: derive,

                resync() {
                    if (stopped || phase === 'access-lost') return

                    if (subscription === 'failed') {
                        release()
                        release = controller.subscribe(tripId, handlers)
                    }

                    void sync()
                },

                submit: deliver,

                reportError(error) {
                    const lost = classifyAccessError(error)

                    if (lost) loseAccess(lost)
                },

                stop() {
                    if (stopped) return

                    stopped = true
                    generation += 1
                    buffer = []
                    release()
                },
            }
        },
    }
}