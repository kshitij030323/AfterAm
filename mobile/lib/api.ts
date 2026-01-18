import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API URL - use your computer's IP for mobile device access
const API_BASE = 'http://192.168.1.9:3001/api';

interface ApiOptions {
    method?: string;
    body?: unknown;
}

async function fetchApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const token = await AsyncStorage.getItem('token');

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
export const register = (data: { email: string; password: string; name: string; phone?: string }) =>
    fetchApi<{ user: User; token: string }>('/auth/register', { method: 'POST', body: data });

export const login = (email: string, password: string) =>
    fetchApi<{ user: User; token: string }>('/auth/login', { method: 'POST', body: { email, password } });

// Phone auth for mobile app
export const phoneAuth = (phone: string, name: string) =>
    fetchApi<{ user: User; token: string }>('/auth/phone-auth', { method: 'POST', body: { phone, name } });

export const getMe = () => fetchApi<User>('/auth/me');

// Events
export const getEvents = (params?: { genre?: string; upcoming?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.genre) query.set('genre', params.genre);
    if (params?.upcoming) query.set('upcoming', 'true');
    const qs = query.toString();
    return fetchApi<Event[]>(`/events${qs ? `?${qs}` : ''}`);
};

export const getEvent = (id: string) => fetchApi<Event>(`/events/${id}`);

// Bookings
export const createBooking = (data: { eventId: string; couples: number; ladies: number; stags: number }) =>
    fetchApi<Booking>('/bookings', { method: 'POST', body: data });

export const getMyBookings = () => fetchApi<Booking[]>('/bookings/my');

export const getBooking = (id: string) => fetchApi<Booking>(`/bookings/${id}`);

export const cancelBooking = (id: string) =>
    fetchApi<{ message: string }>(`/bookings/${id}`, { method: 'DELETE' });

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
    totalGuests?: number;
}

export interface Booking {
    id: string;
    userId: string;
    eventId: string;
    couples: number;
    ladies: number;
    stags: number;
    status: string;
    qrCode: string;
    createdAt: string;
    event?: Event;
}
