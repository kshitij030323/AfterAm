import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Users, Eye, EyeOff } from 'lucide-react';
import { getEvents, deleteEvent, Event } from '../lib/api';
import toast from 'react-hot-toast';

export function Events() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = () => {
        setLoading(true);
        getEvents()
            .then(setEvents)
            .finally(() => setLoading(false));
    };

    useEffect(fetchEvents, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await deleteEvent(id);
            toast.success('Event deleted');
            fetchEvents();
        } catch (err) {
            toast.error('Failed to delete event');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Events</h1>
                    <p className="text-neutral-500">Manage all your events</p>
                </div>
                <Link
                    to="/events/new"
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Event
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
                    <Plus className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 mb-4">No events created yet</p>
                    <Link
                        to="/events/new"
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                        Create First Event
                    </Link>
                </div>
            ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-800">
                                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Event</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Date</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Price</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Bookings</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-neutral-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {events.map((event) => {
                                // Calculate effective status based on close time
                                const getEffectiveStatus = () => {
                                    if (event.guestlistStatus === 'closed') return 'closed';

                                    const now = new Date();
                                    const eventDate = new Date(event.date);

                                    let closeTime: Date | null = null;

                                    if (event.guestlistCloseTime) {
                                        const [hours, mins] = event.guestlistCloseTime.split(':').map(Number);
                                        closeTime = new Date(eventDate);
                                        closeTime.setHours(hours, mins, 0, 0);
                                    } else if (event.guestlistCloseOnStart !== false) {
                                        const [hours, mins] = event.startTime.split(':').map(Number);
                                        closeTime = new Date(eventDate);
                                        closeTime.setHours(hours, mins, 0, 0);
                                    }

                                    if (closeTime) {
                                        if (now >= closeTime) return 'closed';
                                        const twoHoursBefore = new Date(closeTime.getTime() - 2 * 60 * 60 * 1000);
                                        if (now >= twoHoursBefore) return 'closing';
                                    }

                                    return event.guestlistStatus;
                                };

                                const effectiveStatus = getEffectiveStatus();

                                return (
                                    <tr key={event.id} className="hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                                <div>
                                                    <p className="font-medium text-white">{event.title}</p>
                                                    <p className="text-sm text-neutral-500">{event.club} • {event.genre}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-white">{new Date(event.date).toLocaleDateString()}</p>
                                            <p className="text-sm text-neutral-500">{event.startTime} - {event.endTime}</p>
                                        </td>
                                        <td className="px-6 py-4 text-white">{event.priceLabel}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${effectiveStatus === 'open'
                                                ? 'bg-green-500/20 text-green-400'
                                                : effectiveStatus === 'closing'
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {effectiveStatus === 'open' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {effectiveStatus === 'open' ? 'Open' : effectiveStatus === 'closing' ? 'Closing Soon' : 'Closed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/events/${event.id}/bookings`}
                                                className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300"
                                            >
                                                <Users className="w-4 h-4" />
                                                {event._count?.bookings || 0}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/events/${event.id}/edit`}
                                                    className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-700 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(event.id, event.title)}
                                                    className="p-2 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-700 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
