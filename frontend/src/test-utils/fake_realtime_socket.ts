import { vi } from 'vitest'

// Stand-in for realtime/socket.ts. The socket never connects, so component
// tests load data over REST only and never open a real Socket.IO connection.
export function createFakeRealtimeSocketModule() {
    const socket = {
        connected: false,
        active: false,
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        timeout: vi.fn(() => ({ emit: vi.fn() })),
        connect: vi.fn(),
        disconnect: vi.fn(),
    }

    return {
        getRealtimeSocket: () => socket,
        connectRealtime: vi.fn(),
        disconnectRealtime: vi.fn(),
    }
}