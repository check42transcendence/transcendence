import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import type { TripRealtimeController, TripRealtimeHandlers } from './trip_realtime'
import { useTripRealtime } from './useTripRealtime'

afterEach(() => {
    cleanup()
})

// Controller double that records subscriptions and their release functions.
function createFakeController() {
    const releases: Array<ReturnType<typeof vi.fn>> = []
    const subscribe = vi.fn(
        (tripId: string, handlers: TripRealtimeHandlers) => {
            void tripId
            void handlers
            const release = vi.fn()
            releases.push(release)
            return release
        },
    )

    const controller: TripRealtimeController = {
        subscribe,
        getStatus: () => 'idle',
        reset: vi.fn(),
    }

    return { controller, subscribe, releases }
}

it('subscribes on mount and releases on unmount', () => {
    const { controller, subscribe, releases } = createFakeController()

    const { unmount } = renderHook(() =>
        useTripRealtime('trip-1', {}, controller),
    )

    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(subscribe.mock.calls[0][0]).toBe('trip-1')

    unmount()

    expect(releases[0]).toHaveBeenCalledTimes(1)
})

it('releases the old Trip and subscribes to the new one', () => {
    const { controller, subscribe, releases } = createFakeController()

    const { rerender } = renderHook(
        ({ tripId }) => useTripRealtime(tripId, {}, controller),
        { initialProps: { tripId: 'trip-1' } },
    )

    rerender({ tripId: 'trip-2' })

    expect(releases[0]).toHaveBeenCalledTimes(1)
    expect(subscribe).toHaveBeenCalledTimes(2)
    expect(subscribe.mock.calls[1][0]).toBe('trip-2')
})

it('does not subscribe without a Trip ID', () => {
    const { controller, subscribe } = createFakeController()

    renderHook(() => useTripRealtime(undefined, {}, controller))

    expect(subscribe).not.toHaveBeenCalled()
})

it('keeps one subscription when only the handlers change', () => {
    const { controller, subscribe, releases } = createFakeController()
    const first = vi.fn()
    const second = vi.fn()

    const { rerender } = renderHook(
        ({ onEvent }) => useTripRealtime('trip-1', { onEvent }, controller),
        { initialProps: { onEvent: first } },
    )

    rerender({ onEvent: second })

    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(releases[0]).not.toHaveBeenCalled()

    // The subscription forwards events to the newest handler.
    const registered = subscribe.mock.calls[0][1]
    const envelope = {
        tripId: 'trip-1',
        occurredAt: '2026-11-12T10:00:00.000Z',
        data: {},
    }
    registered.onEvent?.('activity:created', envelope)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('activity:created', envelope)
})