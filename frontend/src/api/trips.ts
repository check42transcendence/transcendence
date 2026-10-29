import { apiJson, apiPostJson } from '../shared/api/api-client'

// Public trip information shown in the user's trip list.
export interface TripSummary {
    id: string
    title: string
    destination: string
    startDate: string
    endDate: string
    description: string | null
    currentUserRole: 'OWNER' | 'MEMBER'
}

// Response containing the current user's trips.
export interface TripListResponse {
    trips: TripSummary[]
}

// Data sent when creating a trip.
export interface CreateTripInput {
    title: string
    destination: string
    startDate: string
    endDate: string
    description?: string | null
}

// Public trip details, including the creator and creation time.
export interface TripDetail extends TripSummary {
    createdBy: {
        id: string
        username: string
    }
    createdAt: string
}

// Response containing one trip's public details.
export interface TripResponse {
    trip: TripDetail
}

// Load trips where the current user is a member.
export function getTrips(): Promise<TripListResponse> {
    return apiJson<TripListResponse>('/trips')
}

// Create a trip with its owner membership and itinerary days.
export function createTrip(input: CreateTripInput): Promise<TripResponse> {
    return apiPostJson<TripResponse>('/trips', input)
}
