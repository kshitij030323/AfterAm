const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ApiOptions {
    method?: string;
    body?: unknown;
}

async function fetchApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');

    const config: RequestInit = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// Auth
export const login = (email: string, password: string) =>
    fetchApi<{ user: User; token: string }>('/auth/login', { method: 'POST', body: { email, password } });

export const getMe = () => fetchApi<User>('/auth/me');

// Events
export const getEvents = () => fetchApi<Event[]>('/events');
export const getEvent = (id: string) => fetchApi<Event>(`/events/${id}`);
export const createEvent = (data: EventInput) =>
    fetchApi<Event>('/events', { method: 'POST', body: data });
export const updateEvent = (id: string, data: Partial<EventInput>) =>
    fetchApi<Event>(`/events/${id}`, { method: 'PUT', body: data });
export const deleteEvent = (id: string) =>
    fetchApi<{ message: string }>(`/events/${id}`, { method: 'DELETE' });

// Bookings
export const getEventBookings = (eventId: string) =>
    fetchApi<Booking[]>(`/bookings/event/${eventId}`);
export const updateBookingStatus = (id: string, status: string) =>
    fetchApi<Booking>(`/bookings/${id}/status`, { method: 'PATCH', body: { status } });

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    isAdmin: boolean;
}

export interface Event {
    id: string;
    title: string;
    club: string;
    location: string;
    description: string;
    rules?: string;
    genre: string;
    imageUrl: string;
    bannerUrl?: string;
    videoUrl?: string;
    gallery?: string[];
    price: number;
    priceLabel: string;
    date: string;
    startTime: string;
    endTime: string;
    guestlistStatus: 'open' | 'closing' | 'closed';
    guestlistLimit?: number | null;
    closingThreshold?: number | null;
    guestlistCloseTime?: string | null;
    guestlistCloseOnStart?: boolean;
    featured: boolean;
    _count?: { bookings: number };
}

export interface EventInput {
    title: string;
    club: string;
    location: string;
    description: string;
    rules?: string;
    genre: string;
    imageUrl: string;
    bannerUrl?: string;
    videoUrl?: string;
    gallery?: string[];
    price: number;
    priceLabel: string;
    date: string;
    startTime: string;
    endTime: string;
    guestlistStatus: 'open' | 'closing' | 'closed';
    guestlistLimit?: number | null;
    closingThreshold?: number | null;
    guestlistCloseTime?: string | null;
    guestlistCloseOnStart?: boolean;
    featured: boolean;
}

export interface Booking {
    id: string;
    userId: string;
    eventId: string;
    couples: number;
    ladies: number;
    stags: number;
    guests?: { name: string; gender: string }[];
    status: string;
    qrCode: string;
    createdAt: string;
    user?: { id: string; name: string; email: string; phone?: string };
    event?: Event;
}

export interface Club {
    id: string;
    name: string;
    location: string;
    address?: string;
    mapUrl?: string;
    description?: string;
    imageUrl: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
    _count?: { events: number };
}

export interface ClubInput {
    name: string;
    location: string;
    address?: string;
    mapUrl?: string;
    description?: string;
    imageUrl: string;
}

// Clubs
export const getClubs = () => fetchApi<Club[]>('/clubs');
export const getClub = (id: string) => fetchApi<Club>(`/clubs/${id}`);
export const createClub = (data: ClubInput) =>
    fetchApi<Club>('/clubs', { method: 'POST', body: data });
export const updateClub = (id: string, data: Partial<ClubInput>) =>
    fetchApi<Club>(`/clubs/${id}`, { method: 'PUT', body: data });
export const deleteClub = (id: string) =>
    fetchApi<{ message: string }>(`/clubs/${id}`, { method: 'DELETE' });
export const getClubEvents = (clubId: string) =>
    fetchApi<Event[]>(`/clubs/${clubId}/events`);
export const generateClubCredentials = (id: string) =>
    fetchApi<{ email: string; password: string }>(`/clubs/${id}/credentials`, { method: 'POST' });
