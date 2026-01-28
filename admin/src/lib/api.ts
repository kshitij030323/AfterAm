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
    stagPrice: number;
    couplePrice: number;
    ladiesPrice: number;
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
    stagPrice: number;
    couplePrice: number;
    ladiesPrice: number;
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

// Notifications
export interface NotificationUser {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    hasDeviceToken: boolean;
    createdAt: string;
    guestlistCount: number;
}

export interface NotificationHistory {
    id: string;
    userId: string | null;
    title: string;
    body: string;
    data?: Record<string, string>;
    sentAt: string;
    sentBy: string | null;
    type: string;
    eventId: string | null;
    success: boolean;
    error: string | null;
    user?: { name: string; phone: string } | null;
    event?: { title: string } | null;
}

export interface NotificationHistoryResponse {
    notifications: NotificationHistory[];
    total: number;
    limit: number;
    offset: number;
}

export const getNotificationUsers = () =>
    fetchApi<NotificationUser[]>('/notifications/users');

export const sendNotification = (data: { userIds: string[]; title: string; body: string; eventId?: string }) =>
    fetchApi<{ message: string; success: number; failed: number }>('/notifications/send', { method: 'POST', body: data });

export const sendNotificationToAll = (data: { title: string; body: string; eventId?: string }) =>
    fetchApi<{ message: string; success: number; failed: number }>('/notifications/send-all', { method: 'POST', body: data });

export const getNotificationHistory = (params?: { limit?: number; offset?: number; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    if (params?.type) query.append('type', params.type);
    const queryString = query.toString();
    return fetchApi<NotificationHistoryResponse>(`/notifications/history${queryString ? `?${queryString}` : ''}`);
};
