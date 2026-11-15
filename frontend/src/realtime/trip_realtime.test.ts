import { describe, expect, it, vi } from 'vitest'
import type { RealtimeEnvelope, SubscriptionAck } from '@tripcollab/shared'
import type { RealtimeSocket } from './socket'
import { createTripRealtime } from './trip_realtime'

type Listener = (...args: unknown[]) => void
type AckCallback = (error: Error | null, ack?: SubscriptionAck) => void

interface SentMessage {
    event: string
    tripId: string
    ack: AckCallback
}

// Minimal stand-in for the Socket.IO client, with the few methods used.
class FakeSocket {
    connected = false
    sent: SentMessage[] = []
    private listeners = new Map<string, Set<Listener>>()

    on(event: string, listener: Listener) {
        const set = this.listeners.get(event) ?? new Set()
        set.add(listener)
        this.listeners.set(event, set)
        return this
    }

    off(event: string, listener: Listener) {
        this.listeners.get(event)?.delete(listener)
        return this
    }

    timeout() {
        return {
            emit: (
                event: string,
                payload: { tripId: string },
                ack: AckCallback,
            ) => {
                this.sent.push({ event, tripId: payload.tripId, ack })
            },
        }
    }

    emit(event: string, payload: { tripId: string }, ack: AckCallback) {
        this.sent.push({ event, tripId: payload.tripId, ack })
    }

    // Test helpers.
    fire(event: string, ...args: unknown[]) {
        for (const listener of [...(this.listeners.get(event) ?? [])]) {
            listener(...args)
        }
    }

    connect() {
        this.connected = true
        this.fire('connect')
    }

    disconnect() {
        this.connected = false
        this.fire('disconnect')
    }

    listenerCount() {
        let count = 0
        for (const set of this.listeners.values()) count += set.size
        return count
    }

    events(name: string) {
        return this.sent.filter((message) => message.event === name)
    }
}

function setup(connected = true) {
    const socket = new FakeSocket()
    socket.connected = connected

    const controller = createTripRealtime(
        () => socket as unknown as RealtimeSocket,
    )

    return { socket, controller }
}

function envelope(tripId: string): RealtimeEnvelope<unknown> {
    return { tripId, occurredAt: '2026-11-12T10:00:00.000Z', data: {} }
}

describe('createTripRealtime', () => {
    it('subscribes immediately when the socket is connected', () => {
        const { socket, controller } = setup(true)

        controller.subscribe('trip-1', {})

        expect(socket.events('trip:subscribe')).toHaveLength(1)
        expect(socket.events('trip:subscribe')[0].tripId).toBe('trip-1')
        expect(controller.getStatus('trip-1')).toBe('subscribing')
    })

    it('waits for the connection before subscribing', () => {
        const { socket, controller } = setup(false)

        controller.subscribe('trip-1', {})
        expect(socket.events('trip:subscribe')).toHaveLength(0)
        expect(controller.getStatus('trip-1')).toBe('idle')

        socket.connect()
        expect(socket.events('trip:subscribe')).toHaveLength(1)
    })

    it('sends one subscription for several consumers of a Trip', () => {
        const { socket, controller } = setup()

        const releaseA = controller.subscribe('trip-1', {})
        const releaseB = controller.subscribe('trip-1', {})
        socket.sent[0].ack(null, { ok: true })

        expect(socket.events('trip:subscribe')).toHaveLength(1)

        releaseA()
        expect(socket.events('trip:unsubscribe')).toHaveLength(0)

        releaseB()
        expect(socket.events('trip:unsubscribe')).toHaveLength(1)
        expect(controller.getStatus('trip-1')).toBe('idle')
    })

    it('marks the Trip subscribed after an ok acknowledgement', () => {
        const { socket, controller } = setup()
        const onStatusChange = vi.fn()

        controller.subscribe('trip-1', { onStatusChange })
        socket.sent[0].ack(null, { ok: true })

        expect(onStatusChange).toHaveBeenCalledWith('subscribing')
        expect(onStatusChange).toHaveBeenLastCalledWith('subscribed')
        expect(controller.getStatus('trip-1')).toBe('subscribed')
    })

    it('marks the Trip failed on a refusal or a timeout', () => {
        const refused = setup()
        refused.controller.subscribe('trip-1', {})
        refused.socket.sent[0].ack(null, { ok: false })
        expect(refused.controller.getStatus('trip-1')).toBe('failed')

        const timedOut = setup()
        timedOut.controller.subscribe('trip-1', {})
        timedOut.socket.sent[0].ack(new Error('operation has timed out'))
        expect(timedOut.controller.getStatus('trip-1')).toBe('failed')
    })

    it('retries a failed Trip when a consumer subscribes again', () => {
        const { socket, controller } = setup()

        controller.subscribe('trip-1', {})
        socket.sent[0].ack(null, { ok: false })
        controller.subscribe('trip-1', {})

        expect(socket.events('trip:subscribe')).toHaveLength(2)
    })

    it('tells a late consumer the current status', () => {
        const { socket, controller } = setup()
        const onStatusChange = vi.fn()

        controller.subscribe('trip-1', {})
        socket.sent[0].ack(null, { ok: true })
        controller.subscribe('trip-1', { onStatusChange })

        expect(onStatusChange).toHaveBeenCalledWith('subscribed')
    })

    it('delivers events only to handlers of the matching Trip', () => {
        const { socket, controller } = setup()
        const first = vi.fn()
        const second = vi.fn()

        controller.subscribe('trip-1', { onEvent: first })
        controller.subscribe('trip-2', { onEvent: second })

        const payload = envelope('trip-1')
        socket.fire('activity:created', payload)

        expect(first).toHaveBeenCalledTimes(1)
        expect(first).toHaveBeenCalledWith('activity:created', payload)
        expect(second).not.toHaveBeenCalled()
    })

    it('ignores malformed events and unsubscribed Trips', () => {
        const { socket, controller } = setup()
        const onEvent = vi.fn()

        controller.subscribe('trip-1', { onEvent })
        socket.fire('activity:created', undefined)
        socket.fire('activity:created', { data: {} })
        socket.fire('activity:created', envelope('other-trip'))

        expect(onEvent).not.toHaveBeenCalled()
    })

    it('keeps delivering when one handler throws', () => {
        const { socket, controller } = setup()
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => undefined)
        const healthy = vi.fn()

        controller.subscribe('trip-1', {
            onEvent: () => {
                throw new Error('boom')
            },
        })
        controller.subscribe('trip-1', { onEvent: healthy })
        socket.fire('activity:updated', envelope('trip-1'))

        expect(healthy).toHaveBeenCalledTimes(1)

        consoleError.mockRestore()
    })

    it('removes every socket listener when the last consumer leaves', () => {
        const { socket, controller } = setup()
        expect(socket.listenerCount()).toBe(0)

        const release = controller.subscribe('trip-1', {})
        expect(socket.listenerCount()).toBeGreaterThan(0)

        socket.sent[0].ack(null, { ok: true })
        release()

        expect(socket.listenerCount()).toBe(0)

        controller.subscribe('trip-1', {})
        const afterResubscribe = socket.listenerCount()
        expect(afterResubscribe).toBeGreaterThan(0)
    })

    it('does not add listeners for repeated subscriptions', () => {
        const { socket, controller } = setup()

        controller.subscribe('trip-1', {})
        const baseline = socket.listenerCount()

        controller.subscribe('trip-1', {})
        controller.subscribe('trip-2', {})

        expect(socket.listenerCount()).toBe(baseline)
    })

    it('subscribes again after a reconnect', () => {
        const { socket, controller } = setup()

        controller.subscribe('trip-1', {})
        socket.sent[0].ack(null, { ok: true })

        socket.disconnect()
        expect(controller.getStatus('trip-1')).toBe('idle')

        socket.connect()
        expect(socket.events('trip:subscribe')).toHaveLength(2)
        expect(controller.getStatus('trip-1')).toBe('subscribing')
    })

    it('ignores an acknowledgement that arrives after a disconnect', () => {
        const { socket, controller } = setup()

        controller.subscribe('trip-1', {})
        const staleAck = socket.sent[0].ack

        socket.disconnect()
        staleAck(new Error('socket has been disconnected'))

        expect(controller.getStatus('trip-1')).toBe('idle')
    })

    it('leaves the room if the consumer left while subscribing', () => {
        const { socket, controller } = setup()

        const release = controller.subscribe('trip-1', {})
        release()

        // No unsubscribe yet: the server could still join the room afterwards.
        expect(socket.events('trip:unsubscribe')).toHaveLength(0)

        socket.sent[0].ack(null, { ok: true })

        expect(socket.events('trip:unsubscribe')).toHaveLength(1)
        expect(socket.listenerCount()).toBe(0)
    })

    it('reuses a pending subscription when a consumer returns quickly', () => {
        const { socket, controller } = setup()

        // The same sequence React StrictMode produces in development.
        const release = controller.subscribe('trip-1', {})
        release()
        controller.subscribe('trip-1', {})
        socket.sent[0].ack(null, { ok: true })

        expect(socket.events('trip:subscribe')).toHaveLength(1)
        expect(socket.events('trip:unsubscribe')).toHaveLength(0)
        expect(controller.getStatus('trip-1')).toBe('subscribed')
    })

    it('does not send unsubscribe twice for one release function', () => {
        const { socket, controller } = setup()

        const release = controller.subscribe('trip-1', {})
        socket.sent[0].ack(null, { ok: true })

        release()
        release()

        expect(socket.events('trip:unsubscribe')).toHaveLength(1)
    })

    it('clears everything on reset and ignores later messages', () => {
        const { socket, controller } = setup()
        const onEvent = vi.fn()

        const release = controller.subscribe('trip-1', { onEvent })
        const pendingAck = socket.sent[0].ack

        controller.reset()
        pendingAck(null, { ok: true })
        socket.fire('activity:created', envelope('trip-1'))
        release()

        expect(controller.getStatus('trip-1')).toBe('idle')
        expect(onEvent).not.toHaveBeenCalled()
        expect(socket.listenerCount()).toBe(0)
        expect(socket.events('trip:unsubscribe')).toHaveLength(0)
    })
})
