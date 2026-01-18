import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Plus } from 'lucide-react';
import { useApi } from '../App';

interface Event {
    id: string;
    title: string;
    date: string;
    startTime: string;
    imageUrl: string;
    _count: { bookings: number };
    totalGuests: number;
    scannedCount: number;
}

export function Dashboard() {
    const { fetchApi } = useApi();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await fetchApi('/scanner/events');
            setEvents(data);
        } catch (err) {
            console.error('Failed to load events:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Tonight';
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    if (loading) {
        return <div className="loading-screen"><div className="spinner" /></div>;
    }

    return (
        <div>
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">Your Events</h1>
                    <p className="page-subtitle">Manage guestlists and scan entries</p>
                </div>
                <Link to="/events/new" className="create-event-btn">
                    <Plus size={20} />
                    Create Event
                </Link>
            </div>

            <div className="events-grid">
                {events.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No events scheduled</p>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="event-card">
                            <img src={event.imageUrl} alt={event.title} className="event-image" />
                            <div className="event-info">
                                <h3 className="event-title">{event.title}</h3>
                                <div className="event-meta">
                                    <span><Calendar size={14} /> {formatDate(event.date)}</span>
                                    <span><Clock size={14} /> {event.startTime}</span>
                                </div>
                                <div className="event-stats">
                                    <div className="stat">
                                        <div className="stat-value">{event.totalGuests}</div>
                                        <div className="stat-label">Total Guests</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-value" style={{ color: 'var(--green)' }}>{event.scannedCount}</div>
                                        <div className="stat-label">Checked In</div>
                                    </div>
                                </div>
                            </div>
                            <div className="event-actions">
                                <Link to={`/events/${event.id}/guestlist`} className="btn btn-sm btn-outline">
                                    <Users size={16} /> View Guestlist
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
