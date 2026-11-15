import { getRealtimeSocket } from './socket'
import { createTripRealtime } from './trip_realtime'
import { createTripSync } from './trip_sync'

// The one controller shared by the whole app.
export const tripRealtime = createTripRealtime(getRealtimeSocket)
export const tripSync = createTripSync(tripRealtime)