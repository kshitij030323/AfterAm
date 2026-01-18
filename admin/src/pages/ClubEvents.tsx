import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Clock, Users, Pencil } from 'lucide-react';
import { getClub, getClubEvents, Event, Club } from '../lib/api';

export function ClubEvents() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [club, setClub] = useState<Club | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [clubData, eventsData] = await Promise.all([
                getClub(id!),
                getClubEvents(id!)
            ]);
            setClub(clubData);
            setEvents(eventsData);
        } catch (err) {
            console.error('Failed to load club data:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!club) {
        return (
            <div className="text-center py-16">
                <p className="text-neutral-400">Club not found</p>
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={() => navigate('/clubs')}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Clubs
            </button>

            {/* Club Header */}
            <div className="bg-neutral-900 rounded-xl overflow-hidden mb-8">
                <div className="relative h-48">
                    <img
                        src={club.imageUrl}
                        alt={club.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
                    <div className="absolute bottom-4 left-6">
                        <h1 className="text-3xl font-bold text-white">{club.name}</h1>
                        <p className="text-neutral-300">{club.location}</p>
                    </div>
                </div>
            </div>

            {/* Events Section */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Events at {club.name}</h2>
                <Link
                    to={`/events/new?clubId=${club.id}&clubName=${encodeURIComponent(club.name)}`}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    Add Event
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12 bg-neutral-900 rounded-xl">
                    <p className="text-neutral-400 mb-4">No events for this club yet</p>
                    <Link
                        to={`/events/new?clubId=${club.id}&clubName=${encodeURIComponent(club.name)}`}
                        className="text-purple-400 hover:text-purple-300"
                    >
                        Create the first event
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="bg-neutral-900 rounded-xl p-4 flex items-center gap-4"
                        >
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-24 h-24 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    {event.title}
                                </h3>
                                <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {formatDate(event.date)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {event.startTime}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={14} />
                                        {event._count?.bookings || 0} bookings
                                    </span>
                                </div>
                                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${event.guestlistStatus === 'open'
                                        ? 'bg-green-600/20 text-green-400'
                                        : event.guestlistStatus === 'closing'
                                            ? 'bg-yellow-600/20 text-yellow-400'
                                            : 'bg-red-600/20 text-red-400'
                                    }`}>
                                    {event.guestlistStatus === 'open'
                                        ? 'Guestlist Open'
                                        : event.guestlistStatus === 'closing'
                                            ? 'Closing Soon'
                                            : 'Guestlist Closed'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    to={`/events/${event.id}/bookings`}
                                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors text-sm"
                                >
                                    Bookings
                                </Link>
                                <Link
                                    to={`/events/${event.id}/edit`}
                                    className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                                >
                                    <Pencil size={18} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
