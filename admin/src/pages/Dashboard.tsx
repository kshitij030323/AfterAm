import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Plus } from 'lucide-react';
import { getEvents, Event } from '../lib/api';

export function Dashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getEvents()
            .then(setEvents)
            .finally(() => setLoading(false));
    }, []);

    const totalBookings = events.reduce((sum, e) => sum + (e._count?.bookings || 0), 0);
    const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date());
    const featuredEvents = events.filter((e) => e.featured);

    const stats = [
        { label: 'Total Events', value: events.length, icon: Calendar, color: 'purple' },
        { label: 'Upcoming', value: upcomingEvents.length, icon: TrendingUp, color: 'green' },
        { label: 'Total Bookings', value: totalBookings, icon: Users, color: 'blue' },
        { label: 'Featured', value: featuredEvents.length, icon: Calendar, color: 'amber' },
    ];

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
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-neutral-500">Overview of your events and bookings</p>
                </div>
                <Link
                    to="/events/new"
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Event
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-neutral-500">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Events */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-white">Recent Events</h2>
                    <Link to="/events" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                        View All →
                    </Link>
                </div>

                {events.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                        <p className="text-neutral-500 mb-4">No events yet</p>
                        <Link
                            to="/events/new"
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create First Event
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.slice(0, 5).map((event) => (
                            <Link
                                key={event.id}
                                to={`/events/${event.id}/bookings`}
                                className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-800 transition-colors group"
                            >
                                <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-16 h-16 rounded-xl object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                                        {event.title}
                                    </h3>
                                    <p className="text-sm text-neutral-500 truncate">
                                        {event.club} • {new Date(event.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-white">{event._count?.bookings || 0}</p>
                                    <p className="text-xs text-neutral-500">Bookings</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
